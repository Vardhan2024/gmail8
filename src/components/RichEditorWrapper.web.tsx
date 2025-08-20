import React, { forwardRef, useImperativeHandle, useRef } from 'react';

export const actions = {
	setBold: 'bold',
	setItalic: 'italic',
	setUnderline: 'underline',
} as const;

type EditorProps = {
	style?: React.CSSProperties;
	placeholder?: string;
	initialContentHTML?: string;
	onChange?: (html: string) => void;
	editorStyle?: { contentCSSText?: string; backgroundColor?: string; color?: string; placeholderColor?: string };
};

export type RichTextEditorHandle = {
	setFontName: (font: string) => void;
};

export const RichTextEditor = forwardRef<RichTextEditorHandle, EditorProps>(({ style, placeholder, initialContentHTML, onChange, editorStyle }, ref) => {
	const divRef = useRef<HTMLDivElement>(null);

	useImperativeHandle(ref, () => ({
		setFontName: (font: string) => {
			if (divRef.current) {
				divRef.current.style.fontFamily = font;
			}
		},
	}));

	return (
		<div
			ref={divRef}
			contentEditable
			style={{
				outline: 'none',
				minHeight: 150,
				padding: 8,
				borderRadius: 20,
				fontSize: 16,
				backgroundColor: editorStyle?.backgroundColor || '#E5F5E2',
				color: editorStyle?.color || '#222',
				...(style || {}),
			}}
			dangerouslySetInnerHTML={{ __html: initialContentHTML || '' }}
			onInput={(e) => onChange?.((e.target as HTMLDivElement).innerHTML)}
		/>
	);
});

export const RichTextToolbar: React.FC<{ editor?: any; actions: string[]; iconMap?: Record<string, () => React.ReactNode>; style?: React.CSSProperties }> = ({ actions: acts, iconMap, style }) => {
	const exec = (action: string) => {
		document.execCommand(action);
	};
	return (
		<div style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 8, ...(style || {}) }}>
			{acts.map((a) => (
				<button key={a} onClick={() => exec(a)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label={a}>
					{iconMap?.[a]?.() || a}
				</button>
			))}
		</div>
	);
};


