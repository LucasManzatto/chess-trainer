## ADDED Requirements

### Requirement: Login modal controlled by URL search param
The app SHALL show a login modal when the URL contains `?modal=login`. The root route SHALL declare `modal` as a validated search param. Removing or clearing the param SHALL close the modal.

#### Scenario: Modal opens from URL param
- **WHEN** the URL is `/?modal=login`
- **THEN** the login modal is visible over the current page content

#### Scenario: Modal absent without param
- **WHEN** the URL has no `modal` search param
- **THEN** no login modal is rendered

#### Scenario: Closing modal clears param
- **WHEN** the user dismisses the login modal
- **THEN** the `modal` search param is removed from the URL and the modal closes

### Requirement: Login modal renders Neon AuthView
The modal SHALL render `<AuthView pathname="sign-in" />` from `@neondatabase/neon-js/auth/react/ui` inside a dialog overlay. The `NeonAuthUIProvider` in the root layout provides the required context.

#### Scenario: AuthView rendered inside modal
- **WHEN** the login modal is open
- **THEN** the Neon sign-in form is visible and functional inside the dialog

#### Scenario: Successful sign-in closes modal
- **WHEN** the user completes sign-in via the AuthView form
- **THEN** the modal closes and the nav updates to show the authenticated state

### Requirement: Auth guard redirects to login modal
When an unauthenticated user attempts to access an auth-required route, the app SHALL redirect to `/?modal=login` rather than showing a dedicated login page.

#### Scenario: Unauthenticated access to dashboard
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** the router redirects to `/?modal=login` and the login modal opens
