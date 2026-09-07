<?php
defined('_ELXIS') or die;

function api_auth_POST() {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'missing_credentials']);
        return;
    }
    $db = elxisDatabase::getInstance();
    $row = $db->loadAssocRow('SELECT id, email, role, password_hash FROM elx_users WHERE email = ?', [$email]);
    if (!$row || !password_verify($password, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_credentials']);
        return;
    }
    $token = bin2hex(random_bytes(32));
    $db->update('elx_user_tokens', ['user_id' => $row['id'], 'token' => $token, 'created_at' => date('Y-m-d H:i:s')]);
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => (string)$row['id'],
            'email' => $row['email'],
            'role' => $row['role']
        ]
    ]);
}
