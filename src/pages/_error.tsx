import type { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "sans-serif",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h1 style={{ fontSize: "4rem", fontWeight: "bold", color: "#e5e7eb", marginBottom: "1rem" }}>
        {statusCode || "Error"}
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        {statusCode === 404
          ? "Page not found"
          : statusCode === 500
          ? "Internal server error"
          : "An unexpected error occurred"}
      </p>
      <a
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          background: "#2563eb",
          color: "white",
          textDecoration: "none",
          borderRadius: "0.5rem",
          fontWeight: "600",
        }}
      >
        Back to Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as { statusCode?: number }).statusCode : 404;
  return { statusCode };
};

export default Error;
