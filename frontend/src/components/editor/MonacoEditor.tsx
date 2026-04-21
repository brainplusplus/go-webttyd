import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

type MonacoEditorProps = {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function MonacoEditor({ value, language, onChange, onSave }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
    editorInstance.addCommand(
      // eslint-disable-next-line no-bitwise
      2048 | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
      () => onSave(),
    );
  };

  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="monaco-wrapper">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
