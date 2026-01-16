<?php

namespace Config;

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', function ($routes) {
    // Auth
    $routes->post('auth/register', 'AuthController::register');
    $routes->post('auth/verify-otp', 'AuthController::verifyOtp');
    $routes->post('auth/login', 'AuthController::login');
    $routes->post('auth/login-otp-request', 'AuthController::requestLoginOtp');

    // Migration (Temporary)
    $routes->get('migrate', 'MigrateController::index');

    // Admin Auth
    $routes->post('admin/auth/login', 'AdminAuthController::login'); // Assuming AdminAuthController exists or is handled separately

    // Protected Routes (User)
    $routes->group('', ['filter' => 'auth'], function ($routes) {
        $routes->get('profile', 'ProfileController::me');
        $routes->post('profile', 'ProfileController::update');
        $routes->post('codes/validate', 'CodeController::validateCode');
        $routes->get('user/history', 'CodeController::history');
        $routes->post('redeem', 'RedemptionController::redeemReward');
    });

    // Public Data
    $routes->get('rewards', 'RewardController::index');

    // Admin Routes
    $routes->group('admin', ['filter' => 'admin_auth'], function ($routes) {
        $routes->get('rewards', 'AdminRewardController::index');
        $routes->post('rewards', 'AdminRewardController::create');
        $routes->post('rewards/(:num)/update', 'AdminRewardController::update/$1');
        $routes->delete('rewards/(:num)', 'AdminRewardController::delete/$1');

        $routes->post('upload-image', 'AdminRewardController::uploadImage');
        $routes->post('upload-pdf', 'AdminRewardController::uploadPdf');

        $routes->get('dashboard', 'DashboardAdminController::getStats');
        $routes->get('stats', 'DashboardAdminController::getStats');
    });
});
