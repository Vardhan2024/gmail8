import React from 'react';

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
	style?: React.CSSProperties;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, style }) => {
	return (
		<input
			type="color"
			value={color}
			onChange={(e) => onChange(e.target.value)}
			style={style as any}
			aria-label="Pick color"
		/>
	);
};

export default ColorPicker;


