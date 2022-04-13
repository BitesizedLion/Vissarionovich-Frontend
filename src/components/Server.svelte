<script>
    export let server;

    let terms = ["mo", "qr", "6mo", "yr", "2yr", "3yr", "once", "n/a"];
</script>

<tr>
    <td class="nowrap text-center">{server.hostname}</td>
    <td class="text-center">{server.server_type}</td>
    <td class="text-center">
        <i class="fas fa-compact-disc os-icon" title="{server.os_id}"></i>
    </td>
    <td class="text-center">{server.cpu}</td>
    <!--<td class="text-nowrap text-center"></td>-->    
    <td class="text-nowrap text-center">{server.ram}<small>{server.ram_type}</small></td>
    <td class="text-nowrap text-center">{server.disk}<small>{server.disk_type}</small></td>
    <td class="text-nowrap text-center">{server.location_id}</td>
    <td class="text-nowrap text-center">{server.provider_id}</td>
    <td class="text-nowrap text-center">{server.price} {server.currency} /{terms[server.payment_term]}</td>
    <td class="text-nowrap text-center">{server.owned_since}</td>
    <!--<td class="text-nowrap text-center"></td>
    <td class="text-nowrap text-center"></td>
    <td class="text-nowrap text-center"></td>
    <td class="text-nowrap text-center"></td>
    <td class="text-nowrap text-center"></td>
    <td class="text-nowrap text-center"></td>-->
</tr>