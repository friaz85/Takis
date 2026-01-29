<?php

namespace Config;

// Create a new instance of our RouteCollection class.
$routes = Services::routes();

// Load the system's routing file first, so that the app and ENVIRONMENT
// can override as needed.
if (file_exists(SYSTEMPATH . 'Config/Routes.php')) {
    require SYSTEMPATH . 'Config/Routes.php';
}

/*
 * --------------------------------------------------------------------
 * Router Setup
 * --------------------------------------------------------------------
 */
$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Home');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override();

/*
 * --------------------------------------------------------------------
 * Route Definitions
 * --------------------------------------------------------------------
 */

$routes->get('/', 'Home::index');

// Public Catalog
$routes->get('rewards', 'RewardAdminController::publicCatalog');

// Auth
$routes->post('auth/register', 'AuthController::register');
$routes->post('auth/verify-otp', 'AuthController::verifyOtp');
$routes->post('auth/login', 'AuthController::login');
$routes->post('auth/login-otp-request', 'AuthController::requestLoginOtp');

// Admin Auth
$routes->post('admin/auth/login', 'AdminAuthController::login');

// Protected Routes (User)
$routes->group('', ['filter' => 'auth'], function ($routes) {
    $routes->get('profile', 'ProfileController::getProfile');
    $routes->get('user/points/(:num)', 'ProfileController::getPoints/$1');
    $routes->get('user/codes/(:num)', 'RedemptionController::codesHistory/$1');
    $routes->get('user/rewards/(:num)', 'RedemptionController::rewardsHistory/$1');
    $routes->post('profile', 'ProfileController::updateProfile');
    $routes->post('codes/redeem', 'RedemptionController::redeemCode');
    $routes->post('codes/validate', 'RedemptionController::redeemCode');
    $routes->get('user/history', 'RedemptionController::history');
    $routes->post('redeem', 'RedemptionController::redeemReward');
});

// Admin Routes
$routes->group('admin', ['filter' => 'admin_auth'], function ($routes) {
    // Reward Admin using RewardAdminController
    $routes->get('rewards', 'RewardAdminController::index');
    $routes->post('rewards', 'RewardAdminController::createReward');
    $routes->post('rewards/create', 'RewardAdminController::createReward');
    $routes->post('rewards/(:num)/update', 'RewardAdminController::updateReward/$1');
    $routes->put('rewards/update/(:num)', 'RewardAdminController::updateReward/$1');
    $routes->delete('rewards/(:num)', 'RewardAdminController::deleteReward/$1');

    // Stats and Dashboard
    $routes->get('dashboard', 'DashboardAdminController::getStats');
    $routes->get('stats', 'DashboardAdminController::getStats');
    $routes->get('users', 'AdminUserController::index');
    $routes->get('entry-codes', 'AdminEntryCodeController::index');

    // Promo Codes Management
    $routes->get('promo-codes', 'AdminPromoCodesController::index');
    $routes->post('promo-codes/generate', 'AdminPromoCodesController::generate');
    $routes->post('promo-codes/upload', 'AdminPromoCodesController::upload');
});

/*
 * --------------------------------------------------------------------
 * Additional Routing
 * --------------------------------------------------------------------
 */
if (file_exists(APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php')) {
    require APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php';
}
