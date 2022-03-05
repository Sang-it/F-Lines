import {
  commands,
  window,
  Disposable,
  ExtensionContext,
  QuickPickItem,
  Selection,
} from "vscode";

class Line implements QuickPickItem {
  label: string;
  line: number;
  description: string;
  constructor(label: string, line: number) {
    this.label = label;
    this.line = line;
    this.description = "" + line;
  }
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("f-lines.find", async () => {
      const activeEditor = window.activeTextEditor;
      if (!activeEditor)
        return window.showInformationMessage(`No active editor`, "OK");
      const disposables: Disposable[] = [];
      try {
        return await new Promise(() => {
          const quickPick = window.createQuickPick<Line>();
          quickPick.items = [
            ...activeEditor.document
              .getText()
              .split("\n")
              .map((content, index) => new Line(content.toLowerCase(), index)),
          ];
          let userInput = "";
          disposables.push(
            quickPick.onDidChangeValue((v) => (userInput = v.toLowerCase())),
            quickPick.onDidChangeSelection((items) => {
              const { label, line } = items[0];
              const leftRangeDelta = label.indexOf(userInput);
              const rightRangeDelta = leftRangeDelta + userInput.length;
              const range = activeEditor.document.lineAt(line).range;
              activeEditor.selection = new Selection(
                range.start.with({ character: rightRangeDelta }),
                range.end.with({ character: leftRangeDelta })
              );
              activeEditor.revealRange(range);
              quickPick.hide();
            }),
            quickPick.onDidHide(() => {
              quickPick.dispose();
            })
          );
          quickPick.show();
        });
      } finally {
        disposables.forEach((d) => d.dispose());
      }
    })
  );
}
