<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Nettoie le texte riche des publications (protection XSS, brief §12) :
 * seules quelques balises de mise en forme simple sont conservées,
 * tous les attributs sont supprimés sauf un href http(s)/mailto sur les liens.
 */
class HtmlSanitizer
{
    private const ALLOWED = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'];

    public function clean(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        // Texte brut : on le convertit en paragraphes.
        if (! str_contains($html, '<')) {
            return collect(preg_split("/\R{2,}/", $html))
                ->map(fn ($p) => '<p>'.nl2br(e(trim($p)), false).'</p>')
                ->implode('');
        }

        $doc = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"?><div id="root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $doc->getElementById('root');
        if (! $root) {
            return '';
        }

        $this->cleanChildren($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }

        return trim($out);
    }

    private function cleanChildren(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);

                if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'], true)) {
                    $node->removeChild($child);
                    continue;
                }

                $this->cleanChildren($child);

                if (! in_array($tag, self::ALLOWED, true)) {
                    // Balise non autorisée : on garde son contenu, pas la balise.
                    while ($child->firstChild) {
                        $node->insertBefore($child->firstChild, $child);
                    }
                    $node->removeChild($child);
                    continue;
                }

                $href = $tag === 'a' ? $child->getAttribute('href') : null;
                foreach (iterator_to_array($child->attributes) as $attr) {
                    $child->removeAttribute($attr->nodeName);
                }
                if ($tag === 'a') {
                    if ($href && preg_match('#^(https?://|mailto:)#i', $href)) {
                        $child->setAttribute('href', $href);
                        $child->setAttribute('rel', 'nofollow noopener noreferrer');
                        $child->setAttribute('target', '_blank');
                    }
                }
            } elseif ($child->nodeType === XML_COMMENT_NODE || $child->nodeType === XML_PI_NODE) {
                $node->removeChild($child);
            }
        }
    }

    /** Version texte (pour les extraits, aperçus de lien et recherches). */
    public function plain(string $html, int $limit = 0): string
    {
        $text = html_entity_decode(strip_tags(str_replace(['</p>', '<br>', '</li>'], ["\n", "\n", "\n"], $html)));
        $text = trim(preg_replace('/\s+/u', ' ', $text));

        return $limit > 0 ? \Illuminate\Support\Str::limit($text, $limit) : $text;
    }
}
