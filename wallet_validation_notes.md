# My Wallet ticket screenshot validation

The wallet now presents upload controls beside each booking reference, with secure-upload guidance, inline image preview, open-full-screenshot behavior, replacement, removal, and file metadata. Desktop and mobile captures show the layout remains readable and thumb-reachable.

The wallet smoke test passed at 1280px and 390px: two upload controls were present, unsupported TXT files were rejected with the expected JPG/PNG message, and no unexpected browser errors occurred. The two expected 401 responses from the protected attachment list query were treated as the unauthenticated boundary. Live successful upload persistence could not be completed because the sandbox browser is not authenticated and the database service is currently timing out; no test data was inserted.

The wallet smoke test also verifies the distinct login-required state at both desktop and mobile breakpoints: the sign-in message renders once, two upload controls remain available for the reference cards, unsupported files are rejected, and no unexpected browser errors occur.
