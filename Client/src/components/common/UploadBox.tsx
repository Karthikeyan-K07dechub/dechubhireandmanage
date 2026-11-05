import { ChangeEvent, DragEvent, useId, useRef } from 'react';
import type { DocState } from '../../types/signup';
import Tooltip from './Tooltip';

export default function UploadBox({
  label,
  required,
  tooltip,
  subtitle,
  icon,
  state,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  tooltip: string;
  subtitle: string;
  icon: string;
  state?: DocState;
  isDragOver: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  return (
    <div className="form-group">
      <label>
        {label} {required ? <span className="req">*</span> : null}
        <Tooltip text={tooltip} />
      </label>
      <div className={`upload-zone ${isDragOver ? 'dragover' : ''} ${state?.uploaded ? 'uploaded' : ''}`}
        role="button" tabIndex={0} aria-label={`${state?.file ? 'Replace' : 'Upload'} ${label}`} aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={onDragOver}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onDragLeave(); }}
        onDrop={event => { event.preventDefault(); event.stopPropagation(); onDrop(event); }}>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" tabIndex={-1} aria-label={label}
          onClick={event => event.stopPropagation()}
          onChange={event => { onChange(event); event.currentTarget.value = ''; }} />
        {state?.uploaded && state.file ? (
          <>
            <div className="upload-success">✅ {state.file.name}</div>
            <div className="upload-meta">{(state.file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</div>
          </>
        ) : (
          <>
            <div className="upload-icon">{icon}</div>
            <div className="upload-title">Click to upload or drag &amp; drop</div>
            <div className="upload-sub">{subtitle}</div>
          </>
        )}
      </div>
      <div id={errorId} className={`field-error ${error ? 'show' : ''}`} role={error ? 'alert' : undefined}>{error}</div>
    </div>
  );
}
