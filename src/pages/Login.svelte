<div class="form-signin">
  <div class="card">
    <div class="card-body shadow">
      <!-- Session Status -->
      <!-- Validation Errors -->

      <h3 class="text-center mb-4">My idlers</h3>

            <div class="form-floating mb-3">
              <label class="small text-muted" for="email">Email</label>
              <input class="form-control" id="email" type="email" name="email" required="required" autofocus="autofocus" />
            </div>

            <div class="form-floating mb-3">
              <label class="small text-muted" for="password">Password</label>
              <input class="form-control" id="password" type="password" name="password" required="required" autocomplete="current-password" />
            </div>

            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" value="remember-me" id="remember-me" />
              <label class="form-check-label" for="remember-me">Remember me</label>
            </div>

            <a class="text-decoration-none" href="https://idlers.obelous.com/forgot-password">Forgot your password?</a>

            <button type="submit" class="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150 mt-3 w-100 btn btn-lg btn-primary">
              Login
            </button>

    </div>
  </div>
</div>

<style>
  .form-signin {
    height: 100%;
    width: 100%;
    max-width: 330px;
    padding: 15px;
    display: grid;
    align-items: center;
    margin: auto;
  }

  .form-signin .checkbox {
    font-weight: 400;
  }

  .form-signin .form-floating:focus-within {
    z-index: 2;
  }

  .form-signin input[type="email"] {
    margin-bottom: -1px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  .form-signin input[type="password"] {
    margin-bottom: 10px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .form-floating>label {
    padding: 0.2rem 0.5rem;
  }
</style>

<link rel="stylesheet" href="https://idlers.obelous.com/css/bootstrap.min.css" />

<svelte:head>
	<script src="https://idlers.obelous.com/js/bootstrap.min.js" defer=""></script>
</svelte:head>