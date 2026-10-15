export const fmtAxis = (value) => {
  const strip = (n) => n.toFixed(1).replace(/\.0$/, "");
  if (value >= 10000000) return `\u20B9${strip(value / 10000000)}Cr`;
  if (value >= 100000) return `\u20B9${strip(value / 100000)}L`;
  if (value >= 1000) return `\u20B9${strip(value / 1000)}k`;
  return `\u20B9${value}`;
};
