import { NostrConnectorClient as _NostrConnectorClient } from "openagents-grpc-proto";
import * as GRPC from "@grpc/grpc-js";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";

export default class PoolConnectorClient extends _NostrConnectorClient {
    constructor(
        ip:string, 
        port:number,
        rootCerts?: Buffer,
        privateKey?: Buffer,
        publicKey?: Buffer
    ) {
        super(
            new GrpcTransport({
                host: `${ip}:${port}`,
                channelCredentials: 
                (!rootCerts || !privateKey || !publicKey)?
                GRPC.ChannelCredentials.createInsecure():
                GRPC.ChannelCredentials.createSsl(
                    rootCerts,
                    privateKey,
                    publicKey,
                )        
            })
        );
    }

    async r<T extends object>(c: UnaryCall<object, T> | Promise<UnaryCall<object, T>>):Promise<T> {
        const cc = await c;
        const rpcStatus = await cc.status;
        if (!( rpcStatus.code.toString()=="0"|| rpcStatus.code.toString()=="OK")) {
            throw new Error(`rpc failed with status ${rpcStatus.code}: ${rpcStatus.detail}`);
        }
        return cc.response;
    }
}