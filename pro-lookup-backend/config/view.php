<?php

return [

    /*
    |--------------------------------------------------------------------------
    | View Storage Paths
    |--------------------------------------------------------------------------
    |
    | Most templating systems load templates from disk. Here you may specify
    | an array of paths that should be checked for your views. Of course
    | the usual Laravel view path has already been registered for you.
    |
    */

    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled View Path
    |--------------------------------------------------------------------------
    |
    | This option determines where all the compiled Blade templates will be
    | stored for your application. Typically, this is within the storage
    | directory. However, as usual, you are free to change this value.
    |
    | Volontairement sans realpath() (contrairement au defaut du framework) :
    | realpath() renvoie false si le dossier n'existe pas encore au moment ou
    | ce fichier est evalue, ce qui fait echouer `artisan view:cache` pendant
    | le build Railway (le dossier existe pourtant, mais pas de facon fiable
    | a cet instant precis dans un build conteneurise).
    |
    */

    'compiled' => env('VIEW_COMPILED_PATH', storage_path('framework/views')),

];
