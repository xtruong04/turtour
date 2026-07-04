/**
 * SkeletonLoader — Neo-Brutalism skeleton placeholders.
 * Warm palette (#ebe0c5 base + #f6efdd highlight), sharp corners (borderRadius:0),
 * CSS shimmer animation — no extra library needed.
 *
 * Usage:
 *   <SkeletonLoader.StatCards count={5} />
 *   <SkeletonLoader.Table rows={6} cols={5} />
 *   <SkeletonLoader.Card lines={3} />
 *   <SkeletonLoader.Block width="100%" height={24} />
 */

import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";

/* ── Shimmer keyframes injected once ── */
const SHIMMER_ID = "neo-skeleton-shimmer";
if (typeof document !== "undefined" && !document.getElementById(SHIMMER_ID)) {
  const style = document.createElement("style");
  style.id = SHIMMER_ID;
  style.textContent = `
    @keyframes neoShimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .neo-skeleton {
      background: linear-gradient(90deg, #ebe0c5 25%, #f6efdd 50%, #ebe0c5 75%);
      background-size: 1200px 100%;
      animation: neoShimmer 1.6s ease-in-out infinite;
      border-radius: 0;
    }
  `;
  document.head.appendChild(style);
}

/* ── Atom: single skeleton block ── */
function Block({ width, height, mb, mt, sx }) {
  return (
    <SoftBox
      className="neo-skeleton"
      sx={{
        width,
        height,
        mb: mb ?? 0,
        mt: mt ?? 0,
        border: "1.5px solid #d9caa6",
        ...sx,
      }}
    />
  );
}

Block.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mb: PropTypes.number,
  mt: PropTypes.number,
  sx: PropTypes.object,
};
Block.defaultProps = { width: "100%", height: 16, sx: {} };

/* ── Stat card skeleton ── */
function StatCard() {
  return (
    <SoftBox
      sx={{
        border: "3px solid #d9caa6",
        borderRadius: 0,
        boxShadow: "6px 6px 0 #d9caa6",
        p: 2.5,
        backgroundColor: "#f6efdd",
      }}
    >
      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Block width="55%" height={12} />
        <Block width={38} height={38} sx={{ border: "2px solid #d9caa6", flexShrink: 0 }} />
      </SoftBox>
      <Block width="40%" height={32} />
    </SoftBox>
  );
}

/* ── Stat card row ── */
function StatCards({ count, xs, sm, xl }) {
  return (
    <Grid container spacing={2.5}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={xs} sm={sm} xl={xl} key={i}>
          <StatCard />
        </Grid>
      ))}
    </Grid>
  );
}

StatCards.propTypes = {
  count: PropTypes.number,
  xs: PropTypes.number,
  sm: PropTypes.number,
  xl: PropTypes.number,
};
StatCards.defaultProps = { count: 4, xs: 6, sm: 6, xl: 3 };

/* ── Table skeleton ── */
function TableSkeleton({ rows, cols }) {
  return (
    <SoftBox sx={{ overflowX: "auto" }}>
      {/* Header row */}
      <SoftBox
        display="flex"
        gap={1}
        py={1.5}
        px={2}
        sx={{ borderBottom: "2px solid #d9caa6", backgroundColor: "#f6efdd" }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Block key={i} width={`${Math.floor(100 / cols)}%`} height={11} />
        ))}
      </SoftBox>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <SoftBox
          key={r}
          display="flex"
          gap={1}
          py={1.25}
          px={2}
          sx={{ borderBottom: "1px solid #d9caa6" }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Block
              key={c}
              width={c === 0 ? "30%" : `${Math.floor(70 / (cols - 1))}%`}
              height={13}
              sx={{ border: "none" }}
            />
          ))}
        </SoftBox>
      ))}
    </SoftBox>
  );
}

TableSkeleton.propTypes = { rows: PropTypes.number, cols: PropTypes.number };
TableSkeleton.defaultProps = { rows: 5, cols: 5 };

/* ── Generic card skeleton ── */
function Card({ lines, showHeader, lineHeights }) {
  const heights = lineHeights || Array.from({ length: lines }, (_, i) =>
    i === 0 ? 18 : i === lines - 1 ? 10 : 13
  );

  return (
    <SoftBox
      sx={{
        border: "3px solid #d9caa6",
        borderRadius: 0,
        boxShadow: "6px 6px 0 #d9caa6",
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    >
      {showHeader && (
        <SoftBox
          px={2.5}
          py={1.75}
          sx={{ borderBottom: "2px solid #d9caa6", backgroundColor: "#f6efdd" }}
        >
          <Block width="40%" height={12} />
        </SoftBox>
      )}
      <SoftBox px={2.5} py={2}>
        {heights.map((h, i) => (
          <Block
            key={i}
            width={i === heights.length - 1 ? "65%" : "100%"}
            height={h}
            mb={1.25}
          />
        ))}
      </SoftBox>
    </SoftBox>
  );
}

Card.propTypes = {
  lines: PropTypes.number,
  showHeader: PropTypes.bool,
  headerHeight: PropTypes.number,
  lineHeights: PropTypes.arrayOf(PropTypes.number),
};
Card.defaultProps = { lines: 4, showHeader: true };

/* ── Dashboard layout skeleton (stat cards + two-column) ── */
function Dashboard({ statCount }) {
  return (
    <SoftBox>
      <StatCards count={statCount} />
      <Grid container spacing={2.5} mt={0.5}>
        <Grid item xs={12} xl={8}>
          <Card lines={6} />
        </Grid>
        <Grid item xs={12} xl={4}>
          <SoftBox display="flex" flexDirection="column" gap={2.5}>
            <Card lines={3} />
            <Card lines={4} />
          </SoftBox>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

Dashboard.propTypes = { statCount: PropTypes.number };
Dashboard.defaultProps = { statCount: 4 };

/* ── Named exports ── */
const SkeletonLoader = { Block, StatCards, Table: TableSkeleton, Card, Dashboard };

export default SkeletonLoader;
