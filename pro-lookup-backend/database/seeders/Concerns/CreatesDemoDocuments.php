<?php

namespace Database\Seeders\Concerns;

/**
 * Petits fichiers valides (PDF, PNG) générés à la volée pour les justificatifs de démonstration.
 */
trait CreatesDemoDocuments
{
    /** PDF d'une page contenant quelques lignes de texte (ASCII). */
    protected function demoPdf(array $lines): string
    {
        $text = '';
        $y = 760;
        foreach ($lines as $i => $line) {
            $size = $i === 0 ? 18 : 12;
            $safe = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $text .= "BT /F1 {$size} Tf 60 {$y} Td ({$safe}) Tj ET\n";
            $y -= $i === 0 ? 40 : 22;
        }

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($text)." >>\nstream\n{$text}endstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        return $pdf."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    /** Image PNG simple (bandeau + texte), pour un justificatif « scanné » de démonstration. */
    protected function demoPng(array $lines): string
    {
        $image = imagecreatetruecolor(900, 600);
        $white = imagecolorallocate($image, 255, 255, 255);
        $navy = imagecolorallocate($image, 10, 37, 64);
        $grey = imagecolorallocate($image, 107, 114, 128);
        imagefilledrectangle($image, 0, 0, 900, 600, $white);
        imagefilledrectangle($image, 0, 0, 900, 70, $navy);
        imagestring($image, 5, 30, 25, 'UNIVERSITE ZTF - BERTOUA', $white);
        $y = 120;
        foreach ($lines as $i => $line) {
            imagestring($image, $i === 0 ? 5 : 4, 40, $y, $line, $i === 0 ? $navy : $grey);
            $y += $i === 0 ? 50 : 30;
        }
        ob_start();
        imagepng($image);
        imagedestroy($image);

        return (string) ob_get_clean();
    }
}
