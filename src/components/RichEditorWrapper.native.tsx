import React from 'react';
export { actions } from 'react-native-pell-rich-editor';
export { RichToolbar as RichTextToolbar } from 'react-native-pell-rich-editor';
import { RichEditor } from 'react-native-pell-rich-editor';

export type RichTextEditorHandle = React.ComponentRef<typeof RichEditor>;

export const RichTextEditor = RichEditor;


