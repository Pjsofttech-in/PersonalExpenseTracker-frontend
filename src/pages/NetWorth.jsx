import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  apiGetNetWorth,
  apiGetNetWorthTarget,
  apiSaveNetWorthTarget,
  apiDeleteNetWorthTarget,
  apiGetNetWorthProjection,
  apiTakeNetWorthSnapshot,
  apiGetNetWorthSnapshots,
  apiGetAssets,
  apiGetLiabilities,
} from "../utils/api";

import { loadTransactionsFromBackend } from "../utils/backendData";

import "../css/NetWorth.css";

const formatMoney = (value) => "₹" + Number(value || 0).toLocaleString("en-IN");

const CURRENT_YEAR = new Date().getFullYear();

function NetWorth() {
  const [netWorth, setNetWorth] = useState(null);
  const [target, setTarget] = useState(null);
  const [projection, setProjection] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    targetAmount: "",
    targetYear: "",
    inflationRate: "",
  });

  /* ═══ पूर्ण Net Worth — records + tagged transactions ═══
     Backend च्या asset-record bug मुळे काही records तयार होऊ
     शकत नाहीत. म्हणून [Asset]/[Liability] tagged transactions
     पण गणनेत घेतल्या जातात — जे already records मध्ये आहेत
     त्यांचे double-counting टळतं. काहीही write होत नाही. */
  const computeFullNetWorth = async (base) => {
    try {
      const [txns, assets, liabilities] = await Promise.all([
        loadTransactionsFromBackend().catch(() => []),
        apiGetAssets().catch(() => []),
        apiGetLiabilities().catch(() => []),
      ]);

      const recordKey = (name, amount, date) =>
        String(name || "")
          .trim()
          .toLowerCase() +
        "|" +
        Number(amount || 0) +
        "|" +
        String(date || "").slice(0, 10);

      const assetKeys = new Set(
        (Array.isArray(assets) ? assets : []).map((a) =>
          recordKey(a.name, a.purchaseValue ?? a.currentValue, a.purchaseDate),
        ),
      );
      const liabKeys = new Set(
        (Array.isArray(liabilities) ? liabilities : []).map((l) =>
          recordKey(
            l.name,
            l.originalAmount ?? l.outstandingAmount,
            l.startDate,
          ),
        ),
      );

      let extraAssets = 0;
      let extraLiabilities = 0;

      for (const t of Array.isArray(txns) ? txns : []) {
        const notes = t.notes || "";
        if (!notes.includes("[Asset]") && !notes.includes("[Liability]"))
          continue;

        const key = recordKey(t.particular, t.amount, t.date);

        if (notes.includes("[Asset]") && !assetKeys.has(key)) {
          extraAssets += Number(t.amount || 0);
        }
        if (notes.includes("[Liability]") && !liabKeys.has(key)) {
          extraLiabilities += Number(t.amount || 0);
        }
      }

      const totalAssets = Number(base.totalAssets || 0) + extraAssets;
      const totalLiabilities =
        Number(base.totalLiabilities || 0) + extraLiabilities;

      return {
        ...base,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
      };
    } catch (err) {
      return base;
    }
  };

  const loadAll = async () => {
    try {
      const worthData = await apiGetNetWorth();
      setNetWorth(await computeFullNetWorth(worthData));

      let targetData = null;
      try {
        targetData = await apiGetNetWorthTarget();
      } catch (err) {
        targetData = null;
      }
      setTarget(targetData);

      if (targetData) {
        try {
          setProjection(await apiGetNetWorthProjection());
        } catch (err) {
          setProjection(null);
        }
      } else {
        setProjection(null);
      }

      setSnapshots(await apiGetNetWorthSnapshots());
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load net worth data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    // entry add/edit/delete झाल्यावर आणि परत page वर आल्यावर
    // boxes आपोआप ताज्या होतील
    const handleRefresh = () => loadAll();

    window.addEventListener("transactionUpdated", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("transactionUpdated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, []);

  const openNewForm = () => {
    setForm({
      targetAmount: "",
      targetYear: String(CURRENT_YEAR),
      inflationRate: "6",
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = () => {
    setForm({
      targetAmount: String(target.targetAmount),
      targetYear: String(target.targetYear),
      inflationRate: String(target.inflationRate),
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(form.targetAmount);
    const year = Number(form.targetYear);
    const inflation = Number(form.inflationRate);

    if (!form.targetAmount || isNaN(amount) || amount < 0.01) {
      setFormError("Target amount must be greater than zero.");
      return;
    }
    if (!form.targetYear || isNaN(year) || year < CURRENT_YEAR) {
      setFormError("Target year must be " + CURRENT_YEAR + " or later.");
      return;
    }
    if (form.inflationRate === "" || isNaN(inflation) || inflation < 0) {
      setFormError("Inflation rate cannot be negative.");
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      await apiSaveNetWorthTarget({
        targetAmount: amount,
        targetYear: year,
        inflationRate: inflation,
      });
      setShowForm(false);
      setMessage("Target saved successfully.");
      await loadAll();
    } catch (err) {
      setFormError(err.message || "Could not save target.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove your net-worth target?")) return;
    setBusy(true);
    try {
      await apiDeleteNetWorthTarget();
      setMessage("Target removed.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Could not remove target.");
    } finally {
      setBusy(false);
    }
  };

  const handleSnapshot = async () => {
    setBusy(true);
    try {
      await apiTakeNetWorthSnapshot();
      setMessage("Snapshot saved.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Could not save snapshot.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-content networth-page">
        <div className="nw-loading">Loading net worth...</div>
      </div>
    );
  }

  const progress = projection
    ? Number(projection.summary.progressPercentage || 0)
    : 0;
  const achieved =
    projection && Number(projection.summary.requiredAnnualSaving) < 0;

  return (
    <div className="settings-content networth-page">
      <div className="nw-page-header">
        <h2>Net Worth</h2>
        <p>Assets − Liabilities · set a target · see your projection</p>
      </div>

      {message && <div className="nw-message">{message}</div>}
      {error && <div className="nw-error">{error}</div>}

      <div className="nw-cards">
        <div className="nw-card">
          <span className="nw-card-label">Total Assets</span>
          <span className="nw-card-value nw-green">
            {formatMoney(netWorth ? netWorth.totalAssets : 0)}
          </span>
        </div>

        <div className="nw-card">
          <span className="nw-card-label">Total Liabilities</span>
          <span className="nw-card-value nw-red">
            {formatMoney(netWorth ? netWorth.totalLiabilities : 0)}
          </span>
        </div>

        <div className="nw-card nw-card-main">
          <span className="nw-card-label">Net Worth</span>
          <span
            className={
              "nw-card-value " +
              (Number(netWorth && netWorth.netWorth) < 0 ? "nw-red" : "nw-blue")
            }
          >
            {formatMoney(netWorth ? netWorth.netWorth : 0)}
          </span>
        </div>
      </div>

      {showForm ? (
        <div className="nw-card-block">
          <h3 className="nw-block-title">
            {target ? "Edit Target" : "Set Target"}
          </h3>

          <form className="nw-form" onSubmit={handleSubmit}>
            <div className="nw-field">
              <label>Amount you want in the target year (₹)</label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 1000000"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm({ ...form, targetAmount: e.target.value })
                }
              />
            </div>

            <div className="nw-field">
              <label>Target year</label>
              <input
                type="number"
                min={CURRENT_YEAR}
                step="1"
                placeholder="e.g. 2045"
                value={form.targetYear}
                onChange={(e) =>
                  setForm({ ...form, targetYear: e.target.value })
                }
              />
            </div>

            <div className="nw-field">
              <label>Inflation rate (%)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 6"
                value={form.inflationRate}
                onChange={(e) =>
                  setForm({ ...form, inflationRate: e.target.value })
                }
              />
            </div>

            <div className="nw-form-buttons">
              <button
                type="submit"
                className="nw-btn nw-btn-primary"
                disabled={busy}
              >
                {target ? "Update Target" : "Save Target"}
              </button>
              <button
                type="button"
                className="nw-btn"
                onClick={() => setShowForm(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>

          {formError && <div className="nw-error">{formError}</div>}
        </div>
      ) : target ? (
        <div className="nw-card-block">
          <div className="nw-target-row">
            <div>
              <h3 className="nw-block-title">Target</h3>
              <p className="nw-target-amount">
                {formatMoney(target.targetAmount)}{" "}
                <span className="nw-target-year">by {target.targetYear}</span>
              </p>
              <p className="nw-target-meta">
                Inflation {target.inflationRate}% per year
              </p>
            </div>

            <div className="nw-target-buttons">
              <button className="nw-btn" onClick={openEditForm} disabled={busy}>
                Edit
              </button>
              <button
                className="nw-btn"
                onClick={handleSnapshot}
                disabled={busy}
              >
                Save Snapshot
              </button>
              <button
                className="nw-btn nw-btn-danger"
                onClick={handleRemove}
                disabled={busy}
              >
                Remove
              </button>
            </div>
          </div>

          {projection && (
            <div className="nw-progress-wrap">
              <div className="nw-progress-info">
                <span>{progress.toFixed(1)}% of target</span>
                <span>
                  {achieved
                    ? "Target achieved 🎉"
                    : formatMoney(projection.summary.requiredAnnualSaving) +
                      " per year needed"}
                </span>
              </div>
              <div className="nw-progress">
                <div
                  className="nw-progress-fill"
                  style={{
                    width: Math.min(Math.max(progress, 0), 100) + "%",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="nw-card-block nw-empty">
          <p>No target set yet.</p>
          <button className="nw-btn nw-btn-primary" onClick={openNewForm}>
            Set Target
          </button>
        </div>
      )}

      {projection && (
        <div className="nw-card-block">
          <h3 className="nw-block-title">Projection</h3>

          <div className="nw-chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={projection.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  width={60}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 100000
                      ? v / 100000 + "L"
                      : v >= 1000
                        ? v / 1000 + "k"
                        : v
                  }
                />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  labelFormatter={(label) => "Year " + label}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualNetWorth"
                  name="Actual"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="projectedNetWorth"
                  name="Projected"
                  stroke="#1976d2"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="targetNetWorth"
                  name="Target"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="2 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="nw-info-grid">
            <div className="nw-info">
              <span>Current Net Worth</span>
              <strong>{formatMoney(projection.summary.currentNetWorth)}</strong>
            </div>
            <div className="nw-info">
              <span>Years Remaining</span>
              <strong>{projection.summary.yearsRemaining}</strong>
            </div>
            <div className="nw-info">
              <span>Required Annual Saving</span>
              <strong>
                {formatMoney(projection.summary.requiredAnnualSaving)}
              </strong>
            </div>
            <div className="nw-info">
              <span>Inflation Rate</span>
              <strong>{projection.assumptions.inflationRate}%</strong>
            </div>
          </div>

          <div className="nw-assumptions">
            <strong>How is this calculated?</strong>
            <p>
              Projected growth uses last year's income (
              {formatMoney(projection.assumptions.baseAnnualIncome)}) with
              expenses growing at {projection.assumptions.inflationRate}%
              inflation
              {projection.assumptions.baseAnnualExpense === null
                ? " (no expense history yet — add last year's income and expenses for an accurate projection)"
                : " (last year: " +
                  formatMoney(projection.assumptions.baseAnnualExpense) +
                  ")"}
              . Method:{" "}
              {projection.assumptions.projectionMethod === "HISTORICAL_AVERAGE"
                ? "historical average"
                : "income–expense inflation"}
              .
            </p>
          </div>
        </div>
      )}

      <div className="nw-card-block">
        <div className="nw-snap-head">
          <h3 className="nw-block-title">Snapshots</h3>
          <button className="nw-btn" onClick={handleSnapshot} disabled={busy}>
            Save Snapshot
          </button>
        </div>

        {snapshots.length === 0 ? (
          <p className="nw-empty-text">No snapshots yet.</p>
        ) : (
          <table className="nw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Year</th>
                <th>Date</th>
                <th>Assets</th>
                <th>Liabilities</th>
                <th>Net Worth</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, index) => (
                <tr key={snap.id}>
                  <td>{index + 1}</td>
                  <td>{snap.year}</td>
                  <td>{snap.snapshotDate}</td>
                  <td className="nw-green">{formatMoney(snap.totalAssets)}</td>
                  <td className="nw-red">
                    {formatMoney(snap.totalLiabilities)}
                  </td>
                  <td>
                    <strong>{formatMoney(snap.netWorth)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default NetWorth;
