<script>
	import { onMount } from 'svelte';
	import ServerItem from "../components/Server.svelte";
	let servers;

	onMount(async () => {
        const response = await fetch('http://localhost:3000/admin/servers');
        const data = await response.json();
        servers = data;
    })
</script>

<main>
    <div class="container-fluid">
        <nav class="navbar navbar-expand-md navbar-light bg-light shadow-sm" aria-label="Eleventh navbar example">
            <div class="container">
                <a class="navbar-brand" href="https://idlers.obelous.com">My Idlers</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample09" aria-controls="navbarsExample09" aria-expanded="false"
                    aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarsExample09">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link" href="#/servers">
                                Servers
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#/shared">
                                Shared
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#/reseller">
                                Reseller
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#/domains">
                                Domains
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#/labels">
                                Labels
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#/misc">
                                Misc
                            </a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="dropdown09" data-bs-toggle="dropdown" aria-expanded="false">More</a>
                            <ul class="dropdown-menu" aria-labelledby="dropdown09">
                                <li>
                                    <a class="dropdown-item" href="#/dns">DNS</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/IPs">IPs</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/locations">Locations</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/os">OS</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/providers">Providers</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/yabs">YABs</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/settings">Settings</a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#/account">Account</a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <a class="text-decoration-none" href="#/logout">
                        Log Out
                    </a>
                </div>
            </div>
        </nav>
    </div>
    
    <div class="container">
        <h3 class="ms-2 mt-3">Servers</h3>
    </div>

    <div class="container">
        <div class="container">
            <div class="card shadow mt-3">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr class="bg-gray-100 bg-">
                                    <th class="nowrap text-center">Name</th>
                                    <th class="text-center"><i class="fas fa-box" title="Virt"></i></th>
                                    <th class="text-center">OS</th>
                                    <th class="text-center"><i class="fas fa-microchip" title="CPU"></i></th>
                                    <!--<th class="text-center">Ghz</th>-->
                                    <th class="text-center"><i class="fas fa-memory" title="ram"></i></th>
                                    <th class="text-center"><i class="fas fa-compact-disc" title="disk"></i></th>
                                    <th class="text-nowrap text-center">Location</th>
                                    <th class="text-nowrap text-center">Provider</th>
                                    <th class="text-nowrap text-center">Price</th>
                                    <th class="text-nowrap text-center">Had since</th>
                                    <!--<th class="text-nowrap text-center">GB5 S</th>
                                    <th class="text-nowrap text-center">GB5 M</th>
                                    <th class="text-nowrap text-center">4k</th>
                                    <th class="text-nowrap text-center">64k</th>
                                    <th class="text-nowrap text-center">512k</th>
                                    <th class="text-nowrap text-center">1m</th>-->
                                </tr>
                            </thead>
                            <tbody>
								{#if servers === undefined}
									Loading Servers...
								{:else}
									{#each servers as server, i}
										<ServerItem {server}/>
									{/each}
								{/if}
								
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<link rel="stylesheet" href="https://idlers.obelous.com/css/bootstrap.min.css" />
<link rel="stylesheet" href="https://idlers.obelous.com/css/fa.min.css" />

<svelte:head>
	<script src="https://idlers.obelous.com/js/bootstrap.min.js" defer=""></script>
</svelte:head>