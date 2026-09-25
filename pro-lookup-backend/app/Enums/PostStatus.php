<?php

namespace App\Enums;

/** États d'une publication (brief §7.3). */
enum PostStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Hidden = 'hidden';
}
