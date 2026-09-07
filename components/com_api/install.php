<?php
defined('_ELXIS') or die;

function com_api_install() {
    // No DB schema changes; reads from existing elx_res_* tables.
    return true;
}

function com_api_uninstall() {
    return true;
}
