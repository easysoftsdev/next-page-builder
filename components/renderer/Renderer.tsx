import type { PageSchema } from "../../types/builder";
import { ComponentRenderer } from "./components";

export function PageRenderer({ page }: { page: PageSchema }) {
  return (
    <div className="renderer-page">
      {page.sections.map((section) => (
        <section className="renderer-section" key={section.id}>
          {section.rows.map((row) => (
            <div className="renderer-row" key={row.id}>
              {row.columns.map((column) => (
                <div
                  className="renderer-column"
                  key={column.id}
                  style={{ gridColumn: `span ${column.span}` }}
                >
                  {column.components.map((component) => (
                    <ComponentRenderer key={component.id} component={component} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
