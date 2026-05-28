<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Models\AdminUserModel;

class CreateAdmin extends BaseCommand
{
    /**
     * The Command's Group
     *
     * @var string
     */
    protected $group = 'Admin';

    /**
     * The Command's Name
     *
     * @var string
     */
    protected $name = 'admin:create';

    /**
     * The Command's Description
     *
     * @var string
     */
    protected $description = 'Crea un nuevo usuario administrador en la base de datos.';

    /**
     * The Command's Usage
     *
     * @var string
     */
    protected $usage = 'admin:create [username] [email] [password] [role]';

    /**
     * The Command's Arguments
     *
     * @var array
     */
    protected $arguments = [
        'username' => 'Nombre de usuario para el admin',
        'email'    => 'Correo electrónico para el admin',
        'password' => 'Contraseña del admin (mínimo 8 caracteres)',
        'role'     => 'Rol (admin, system_admin, takis, ventas)',
    ];

    /**
     * Actually execute a command.
     *
     * @param array $params
     */
    public function run(array $params)
    {
        $username = $params[0] ?? null;
        $email    = $params[1] ?? null;
        $password = $params[2] ?? null;
        $role     = $params[3] ?? 'admin';

        // Check if params are missing, ask interactively if so
        if (empty($username)) {
            $username = CLI::prompt('Nombre de usuario');
        }
        if (empty($email)) {
            $email = CLI::prompt('Correo electrónico');
        }
        if (empty($password)) {
            $password = CLI::prompt('Contraseña', null, 'required');
        }
        if (empty($params[3])) {
            $role = CLI::prompt('Rol', ['admin', 'system_admin', 'takis', 'ventas'], 'required');
        }

        // Validate role values
        $validRoles = ['admin', 'system_admin', 'takis', 'ventas'];
        if (!in_array($role, $validRoles)) {
            CLI::error("Error: El rol '$role' no es válido. Roles permitidos: " . implode(', ', $validRoles));
            return;
        }

        if (strlen($password) < 8) {
            CLI::error("Error: La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        $adminModel = new AdminUserModel();
        $existing   = $adminModel->where('username', $username)->first();

        if ($existing) {
            CLI::write("El usuario '$username' ya existe. Actualizando contraseña, email y rol...", 'yellow');
            
            $updateData = [
                'email'         => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'role'          => $role
            ];

            if ($adminModel->skipValidation(true)->update($existing['id'], $updateData)) {
                CLI::write("¡Éxito! El usuario '$username' ha sido actualizado correctamente con la nueva contraseña.", 'green');
            } else {
                CLI::error("Error al actualizar el usuario.");
            }
            return;
        }

        // Check email uniqueness for new users
        if ($adminModel->where('email', $email)->first()) {
            CLI::error("Error: El correo '$email' ya está registrado con otro usuario.");
            return;
        }

        $data = [
            'username'      => $username,
            'email'         => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role'          => $role
        ];

        CLI::write("Creando administrador con los siguientes datos:", 'yellow');
        CLI::write("  Usuario:  $username");
        CLI::write("  Email:    $email");
        CLI::write("  Rol:      $role");
        CLI::write("------------------------------------", 'yellow');

        if ($adminModel->skipValidation(true)->insert($data)) {
            CLI::write("¡Éxito! El usuario '$username' ha sido creado correctamente.", 'green');
        } else {
            CLI::error("Error al crear el usuario.");
        }
    }
}
