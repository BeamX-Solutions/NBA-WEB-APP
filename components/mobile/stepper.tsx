import { Fragment } from "react";
import { Icon } from "./icon";

/**
 * mobile Stepper: completed steps show a tick, the step in progress its number inside a tinted ring,
 * later steps are greyed. Connectors run only between steps.
 */
export function Stepper({ current, labels }: { current: number; labels: readonly string[] }) {
  return <div aria-label={`Step ${current} of ${labels.length}: ${labels[current - 1] ?? ""}`} aria-valuemax={labels.length} aria-valuemin={1} aria-valuenow={current} className="mb-4 flex items-start" role="progressbar">
    {labels.map((label, index) => {
      const step = index + 1;
      const done = step < current;
      const active = step === current;
      return <Fragment key={label}>
        {index > 0 ? <span className={`mx-1 mt-[17px] h-[2px] flex-1 rounded-full ${step <= current ? "bg-primary" : "bg-border"}`}/> : null}
        <div className="flex w-[84px] flex-col items-center">
          <span className={`rounded-full p-1 ${active ? "bg-primary-surface" : ""}`}>
            <span className={`grid size-7 place-items-center rounded-full border ${done || active ? "border-primary bg-primary text-text-inverse" : "border-border bg-surface-muted text-text-muted"}`}>
              {done ? <Icon name="check" size={15}/> : <span className="text-label font-bold">{step}</span>}
            </span>
          </span>
          <span className={`mt-1 text-center text-caption ${done || active ? "font-semibold text-text" : "font-medium text-text-muted"}`}>{label}</span>
        </div>
      </Fragment>;
    })}
  </div>;
}
