<?php
/**
 * Plugin Name: User Suspension API
 * Plugin URI: https://liq.com.mx
 * Description: Agrega endpoints REST API para suspender/habilitar usuarios y previene que usuarios suspendidos inicien sesión en WordPress.
 * Version: 1.0.0
 * Author: Paco
 * Author URI: https://liq.com.mx
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: user-suspension-api
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom REST API endpoints for user suspension
 */
add_action('rest_api_init', function () {
    // Endpoint to suspend a user
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/suspend', array(
        'methods' => 'POST',
        'callback' => 'custom_suspend_user',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'reason' => array(
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field'
            ),
        ),
    ));

    // Endpoint to unsuspend a user
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/unsuspend', array(
        'methods' => 'POST',
        'callback' => 'custom_unsuspend_user',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Endpoint to check suspension status
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/suspension-status', array(
        'methods' => 'GET',
        'callback' => 'custom_get_suspension_status',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

/**
 * Suspend a user
 */
function custom_suspend_user($request) {
    $user_id = $request['id'];
    $reason = $request->get_param('reason') ?: 'No reason provided';

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    // Don't allow suspending administrators
    if (in_array('administrator', $user->roles)) {
        return new WP_Error('cannot_suspend_admin', 'Cannot suspend administrator users', array('status' => 403));
    }

    // Set user meta to mark as suspended
    update_user_meta($user_id, 'account_suspended', true);
    update_user_meta($user_id, 'suspension_reason', $reason);
    update_user_meta($user_id, 'suspended_at', current_time('mysql'));
    update_user_meta($user_id, 'suspended_by', get_current_user_id());

    // Destroy all sessions for this user (log them out)
    $sessions = WP_Session_Tokens::get_instance($user_id);
    $sessions->destroy_all();

    return array(
        'success' => true,
        'message' => 'User suspended successfully',
        'user_id' => $user_id,
        'suspended' => true,
        'reason' => $reason,
    );
}

/**
 * Unsuspend a user
 */
function custom_unsuspend_user($request) {
    $user_id = $request['id'];

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    // Remove suspension meta
    delete_user_meta($user_id, 'account_suspended');
    delete_user_meta($user_id, 'suspension_reason');
    delete_user_meta($user_id, 'suspended_at');
    delete_user_meta($user_id, 'suspended_by');

    return array(
        'success' => true,
        'message' => 'User unsuspended successfully',
        'user_id' => $user_id,
        'suspended' => false,
    );
}

/**
 * Get suspension status
 */
function custom_get_suspension_status($request) {
    $user_id = $request['id'];

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    $is_suspended = get_user_meta($user_id, 'account_suspended', true);

    return array(
        'user_id' => $user_id,
        'suspended' => (bool) $is_suspended,
        'reason' => $is_suspended ? get_user_meta($user_id, 'suspension_reason', true) : null,
        'suspended_at' => $is_suspended ? get_user_meta($user_id, 'suspended_at', true) : null,
        'suspended_by' => $is_suspended ? get_user_meta($user_id, 'suspended_by', true) : null,
    );
}

/**
 * Prevent suspended users from logging in
 */
add_filter('wp_authenticate_user', function ($user) {
    if (is_wp_error($user)) {
        return $user;
    }

    $is_suspended = get_user_meta($user->ID, 'account_suspended', true);

    if ($is_suspended) {
        $reason = get_user_meta($user->ID, 'suspension_reason', true);
        $message = 'Tu cuenta ha sido suspendida.';

        if ($reason) {
            $message .= ' Razón: ' . esc_html($reason);
        }

        return new WP_Error('account_suspended', $message);
    }

    return $user;
}, 30, 1);

/**
 * Get enrolled courses for a user (Tutor LMS)
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/courses', array(
        'methods' => 'GET',
        'callback' => 'custom_get_user_courses',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

function custom_get_user_courses($request) {
    global $wpdb;
    $user_id = intval($request['id']);

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    // Tutor LMS stores enrollments as posts with post_type = 'tutor_enrolled'
    // post_parent = course_id, post_author = user_id
    $enrollments = $wpdb->get_results($wpdb->prepare(
        "SELECT p.post_parent as course_id, p.post_date as enrolled_at, p.post_status
         FROM {$wpdb->posts} p
         WHERE p.post_type = 'tutor_enrolled'
         AND p.post_author = %d
         AND p.post_status = 'completed'
         ORDER BY p.post_date DESC",
        $user_id
    ));

    if (empty($enrollments)) {
        return array('courses' => array());
    }

    $courses = array();
    foreach ($enrollments as $enrollment) {
        $course_id = intval($enrollment->course_id);
        $course = get_post($course_id);
        if (!$course) continue;

        $thumbnail_url = get_the_post_thumbnail_url($course_id, 'medium') ?: null;

        $courses[] = array(
            'id'          => $course_id,
            'title'       => array('rendered' => $course->post_title),
            'status'      => $course->post_status,
            'link'        => get_permalink($course_id),
            'date'        => $enrollment->enrolled_at,
            'thumbnail'   => $thumbnail_url,
        );
    }

    return array('courses' => $courses);
}

/**
 * Add suspension info to user REST API response
 */
add_filter('rest_prepare_user', function ($response, $user) {
    $is_suspended = get_user_meta($user->ID, 'account_suspended', true);

    $response->data['is_suspended'] = (bool) $is_suspended;

    if ($is_suspended) {
        $response->data['suspension_reason'] = get_user_meta($user->ID, 'suspension_reason', true);
        $response->data['suspended_at'] = get_user_meta($user->ID, 'suspended_at', true);
    }

    return $response;
}, 10, 2);
