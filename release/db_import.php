<?php
$host = 'localhost';
$db   = 'dbx7kmb408ygd7';
$user = 'ubayhneffxygo';
$pass = '1*@J$`r4:e`B';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/api/database/schema.sql');
    if (!$sql)
        die("No se encontró schema.sql");

    $pdo->exec($sql);
    echo "¡Base de datos importada con éxito!";
} catch (PDOException $e) {
    die("Error de conexión/importación: " . $e->getMessage());
}
