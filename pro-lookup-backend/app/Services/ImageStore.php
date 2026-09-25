<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Enregistre une image publique après l'avoir redimensionnée et ré-encodée avec GD.
 * Le ré-encodage supprime les métadonnées (EXIF, position GPS…) — brief §12.
 */
class ImageStore
{
    public function store(UploadedFile $file, string $directory, int $maxWidth = 1600): string
    {
        $source = @imagecreatefromstring((string) file_get_contents($file->getRealPath()));

        // Format non lisible par GD : on stocke le fichier tel quel (déjà validé comme image).
        if (! $source) {
            return $file->store($directory, 'public');
        }

        $width = imagesx($source);
        $height = imagesy($source);
        if ($width > $maxWidth) {
            $newHeight = (int) round($height * $maxWidth / $width);
            $resized = imagecreatetruecolor($maxWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
            imagedestroy($source);
            $source = $resized;
        }

        $isPng = in_array(strtolower($file->getClientOriginalExtension()), ['png', 'gif'], true);
        ob_start();
        if ($isPng) {
            imagesavealpha($source, true);
            imagepng($source, null, 6);
        } else {
            imagejpeg($source, null, 85);
        }
        $binary = ob_get_clean();
        imagedestroy($source);

        $path = trim($directory, '/').'/'.Str::uuid().($isPng ? '.png' : '.jpg');
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
