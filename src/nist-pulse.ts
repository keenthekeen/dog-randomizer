export type Pulse = {
    "uri": string,
    "version": string,
    "cipherSuite": number,
    "period": number,
    "certificateId": string,
    "chainIndex": number,
    "pulseIndex": number,
    "timeStamp": string,
    "localRandomValue": string,
    "external": Object,
    "listValues": Object[],
    "precommitmentValue": string,
    "statusCode": number,
    "signatureValue": string,
    "outputValue": string,
    "trimmedRandomValue": string,
}