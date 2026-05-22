"use client";

import React from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
  type TextFormatType,
} from "lexical";
import { configExtension } from "@lexical/extension";
import { TabIndentationExtension } from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListExtension,
} from "@lexical/list";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextExtension } from "@lexical/rich-text";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { cn } from "@/lib/utils";

const editorTheme = {
  paragraph: "mb-2 last:mb-0",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  list: {
    ol: "ml-5 list-decimal space-y-1",
    ul: "ml-5 list-disc space-y-1",
    listitem: "pl-1",
    nested: {
      listitem: "list-none",
    },
  },
};

function createInitialEditorState(note: string | null | undefined) {
  const initialNote = note?.trim();

  if (!initialNote) {
    return undefined;
  }

  if (isLexicalEditorState(initialNote)) {
    return initialNote;
  }

  return () => {
    const root = $getRoot();
    root.clear();

    initialNote.split(/\r?\n/).forEach((line) => {
      const paragraph = $createParagraphNode();

      if (line.length > 0) {
        paragraph.append($createTextNode(line));
      }

      root.append(paragraph);
    });
  };
}

function isLexicalEditorState(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && parsed.root;
  } catch {
    return false;
  }
}

function serializeEditorState(editorState: EditorState) {
  let isEmpty = false;

  editorState.read(() => {
    isEmpty = $getRoot().getTextContent().trim().length === 0;
  });

  return isEmpty ? "" : JSON.stringify(editorState.toJSON());
}

function NotesEditor({ note }: { note: string | null | undefined }) {
  const { updateUserNote } = useCourseApi();
  const lastSavedNote = React.useRef(note?.trim() ?? "");
  const hasHydrated = React.useRef(false);
  const [pendingNote, setPendingNote] = React.useState(lastSavedNote.current);
  const [debouncedNote] = useDebounce(pendingNote, 700);
  const initialEditorState = React.useMemo(
    () => createInitialEditorState(note),
    [note],
  );

  const notesExtension = React.useMemo(
    () =>
      defineExtension({
        name: "planner-notes",
        namespace: "PlannerNotes",
        theme: editorTheme,
        onError: (error) => {
          throw error;
        },
        $initialEditorState: initialEditorState,
        dependencies: [
          RichTextExtension,
          configExtension(HistoryExtension, { delay: 500 }),
          configExtension(TabIndentationExtension, { maxIndent: 4 }),
          configExtension(ListExtension, {
            hasStrictIndent: false,
            shouldPreserveNumbering: true,
          }),
        ],
      }),
    [initialEditorState],
  );

  React.useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    if (debouncedNote === lastSavedNote.current) {
      return;
    }

    let isCurrent = true;

    const updateNote = async () => {
      const res = await updateUserNote(debouncedNote);

      if (!isCurrent) {
        return;
      }

      if (!res.ok) {
        toast.error("Failed to update note");
        return;
      }

      lastSavedNote.current = debouncedNote;
    };

    updateNote();

    return () => {
      isCurrent = false;
    };
  }, [debouncedNote, updateUserNote]);

  return (
    <LexicalExtensionComposer extension={notesExtension} contentEditable={null}>
      <div className="border-b bg-muted/20 px-2 py-1">
        <NotesToolbar />
      </div>
      <div className="relative min-h-44 max-h-64 overflow-y-auto bg-background/40">
        <ContentEditable
          aria-placeholder="Add any notes about the courses you want to take here..."
          className="min-h-44 px-3 py-2 text-sm outline-hidden focus-visible:ring-0"
          placeholder={
            <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
              Add any notes about the courses you want to take here...
            </div>
          }
        />
      </div>
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(editorState) =>
          setPendingNote(serializeEditorState(editorState))
        }
      />
    </LexicalExtensionComposer>
  );
}

function NotesToolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = React.useState<
    Record<TextFormatType, boolean>
  >({
    bold: false,
    code: false,
    highlight: false,
    italic: false,
    lowercase: false,
    strikethrough: false,
    subscript: false,
    superscript: false,
    underline: false,
    uppercase: false,
    capitalize: false,
  });
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      return;
    }

    setActiveFormats((current) => ({
      ...current,
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
    }));
  }, []);

  React.useEffect(() => {
    const unregisterUpdate = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(updateToolbar);
      },
    );
    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    const unregisterCanUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    const unregisterCanRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterUpdate();
      unregisterSelection();
      unregisterCanUndo();
      unregisterCanRedo();
    };
  }, [editor, updateToolbar]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1">
        <ToolbarButton
          label="Undo"
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          <Redo2 />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Bold"
          active={activeFormats.bold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={activeFormats.italic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={activeFormats.underline}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
        >
          <Underline />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Bulleted list"
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        >
          <ListOrdered />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "h-8 w-8",
            active && "bg-accent text-accent-foreground",
          )}
          disabled={disabled}
          onClick={onClick}
          size="icon"
          type="button"
          variant="ghost"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default NotesEditor;
