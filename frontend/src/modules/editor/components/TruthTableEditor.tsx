import { useEffect, useState } from 'react';
import type { TruthTableRow } from '../../../types/circuit';

interface TruthTableEditorProps {
  inputLabels: string[];
  outputLabels: string[];
  rows: TruthTableRow[];
  onChange: (rows: TruthTableRow[]) => void;
  readOnlyInputs?: boolean;
  allowAddRow?: boolean;
}

export function TruthTableEditor({
  inputLabels,
  outputLabels,
  rows,
  onChange,
  readOnlyInputs = false,
  allowAddRow = true,
}: TruthTableEditorProps) {
  const [draftRows, setDraftRows] = useState<TruthTableRow[]>(rows);

  useEffect(() => {
    setDraftRows(rows);
  }, [rows]);

  function updateRows(nextRows: TruthTableRow[]) {
    setDraftRows(nextRows);
    onChange(nextRows);
  }

  function addRow() {
    updateRows([
      ...draftRows,
      {
        inputs: inputLabels.map(() => false),
        outputs: outputLabels.map(() => false),
      },
    ]);
  }

  function toggleCell(rowIndex: number, side: 'inputs' | 'outputs', cellIndex: number) {
    updateRows(
      draftRows.map((row, index) => {
        if (index !== rowIndex) return row;
        const nextSide = row[side].map((value, valueIndex) => (valueIndex === cellIndex ? !value : value));
        return { ...row, [side]: nextSide };
      }),
    );
  }

  return (
    <div className="truth-table-editor">
      <div className="truth-table-header">
        <h3>Wahrheitstabelle</h3>
        {allowAddRow && (
          <button className="secondary-button small" type="button" onClick={addRow}>
            Zeile hinzufügen
          </button>
        )}
      </div>

      {draftRows.length === 0 ? (
        <p className="muted">Noch keine Zeilen definiert.</p>
      ) : (
        <div className="truth-table-scroll">
          <table>
            <thead>
              <tr>
                {inputLabels.map((label, index) => (
                  <th key={`input-${index}-${label}`}>{label}</th>
                ))}
                {outputLabels.map((label, index) => (
                  <th key={`output-${index}-${label}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draftRows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.inputs.join('')}-${row.outputs.join('')}`}>
                  {row.inputs.map((value, cellIndex) => (
                    <td key={`in-${cellIndex}`}>
                      {readOnlyInputs ? (
                        <span className="truth-table-value">{value ? '1' : '0'}</span>
                      ) : (
                        <button type="button" onClick={() => toggleCell(rowIndex, 'inputs', cellIndex)}>
                          {value ? '1' : '0'}
                        </button>
                      )}
                    </td>
                  ))}
                  {row.outputs.map((value, cellIndex) => (
                    <td key={`out-${cellIndex}`}>
                      <button type="button" onClick={() => toggleCell(rowIndex, 'outputs', cellIndex)}>
                        {value ? '1' : '0'}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
