import type { CriterionResult } from "../types";

interface Props {
  result: CriterionResult;
}

export default function CriterionRow({ result }: Props) {
  const icon = result.skipped ? (
    <span className="text-skip text-base" title="Skipped (requires --ai)">
      &#9675;
    </span>
  ) : result.pass ? (
    <span className="text-pass text-base" title="Pass">
      &#10003;
    </span>
  ) : (
    <span className="text-fail text-base" title="Fail">
      &#10007;
    </span>
  );

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="w-5 flex-shrink-0 text-center mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            result.skipped
              ? "text-gray-500"
              : result.pass
                ? "text-gray-300"
                : "text-gray-300"
          }`}
        >
          {result.message}
        </p>
        {result.skipped && (
          <p className="text-xs text-cyan-500/70 mt-0.5">requires --ai</p>
        )}
        {!result.pass && !result.skipped && result.details && (
          <p className="text-xs text-gray-500 mt-0.5">{result.details}</p>
        )}
      </div>
    </div>
  );
}
