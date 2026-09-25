"use client";

import clsx from "clsx";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Icon } from "@/components/ui/Icon";

/**
 * Éditeur de texte simple pour les publications (brief §7.2) : paragraphes, gras,
 * italique, listes, liens. Le HTML produit est de toute façon nettoyé par Laravel.
 */
export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Rédigez votre publication…" }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "prose-post tiptap px-4 py-3 text-[15px] leading-relaxed", "aria-label": "Texte de la publication" },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  if (!editor) {
    return <div className="h-56 animate-pulse rounded-xl border border-line bg-mist" />;
  }

  const tool = (active: boolean) =>
    clsx("inline-flex size-9 items-center justify-center rounded-lg transition", active ? "bg-navy text-white" : "text-navy hover:bg-mist");

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresse du lien (https://…)", previous ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-teal focus-within:ring-3 focus-within:ring-teal/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-canvas px-2 py-1.5" role="toolbar" aria-label="Mise en forme">
        <button type="button" className={tool(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Gras" aria-pressed={editor.isActive("bold")}>
          <Icon name="format_bold" size={20} />
        </button>
        <button type="button" className={tool(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italique" aria-pressed={editor.isActive("italic")}>
          <Icon name="format_italic" size={20} />
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <button type="button" className={tool(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Intertitre">
          <Icon name="title" size={20} />
        </button>
        <button type="button" className={tool(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Liste à puces">
          <Icon name="format_list_bulleted" size={20} />
        </button>
        <button type="button" className={tool(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Liste numérotée">
          <Icon name="format_list_numbered" size={20} />
        </button>
        <button type="button" className={tool(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Citation">
          <Icon name="format_quote" size={20} />
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <button type="button" className={tool(editor.isActive("link"))} onClick={setLink} aria-label="Lien">
          <Icon name="link" size={20} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
