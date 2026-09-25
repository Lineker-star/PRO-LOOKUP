<?php

namespace App\Enums;

/** Cycle de vie d'un compte enseignant (brief §5.2). */
enum UserStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Suspended = 'suspended';
}
