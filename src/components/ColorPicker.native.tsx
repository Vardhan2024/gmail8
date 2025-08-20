import React from 'react';
import WheelColorPicker from 'react-native-wheel-color-picker';

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
	style?: any;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, style }) => {
	return (
		<WheelColorPicker
			color={color}
			onColorChange={onChange}
			style={style || { width: 200, height: 200, alignSelf: 'center', marginVertical: 8 }}
		/>
	);
};

export default ColorPicker;


