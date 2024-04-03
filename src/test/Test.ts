
import JobManager from "../runtime/JobManager";
import JobHostFunctions from "../runtime/binds/JobHostFunctions";
import NostrHostFunctions from "../runtime/binds/NostrHostFunctions";
import NostrConnectorClient from "../runtime/NostrConnectorClient";
import TestHostFunctions from "../runtime/binds/TestHostFunctions";
import * as Extism from "@extism/extism";

async function main() {
    const IP = process.env.NOSTR_CONNECT_GRPC_BINDING_ADDRESS || "0.0.0.0";
    const PORT = Number(process.env.NOSTR_CONNECT_GRPC_BINDING_PORT || 5000);
    const nostrConnector = new NostrConnectorClient(IP, PORT);


    const interceptor = (
        functioName,
        mng,
        jobId,
        callContext,
        ...args
    ) => {
        console.log("Intercepted function call: ", functioName, args);
        return args;
    }

    const hostFunctions = [
        new JobHostFunctions(nostrConnector).interceptedBy(interceptor),
        new NostrHostFunctions(nostrConnector).interceptedBy(interceptor),
        new TestHostFunctions().interceptedBy(interceptor),
    ];

    const mergedFunctions = {};
    for (const hf of hostFunctions) {
        Object.assign(mergedFunctions, hf.getHostFunctions(new JobManager(nostrConnector), ""));
    }

    const plugin = Extism.createPlugin("./plugin/plugin.wasm", {
        useWasi: true,
        runInWorker: true,
        functions: {
            env: mergedFunctions,
        },
    });

    const res = (await plugin).call("run", "{}");
    console.log(res);

}

main();
