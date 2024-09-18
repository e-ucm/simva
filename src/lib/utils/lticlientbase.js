module.exports = {
    "clientId": "",
    "surrogateAuthRequired": false,
    "enabled": true,
    "alwaysDisplayInConsole": false,
    "clientAuthenticatorType": "client-jwt",
    "redirectUris": [
        "https://lti-ri.imsglobal.org/lti/tools/*"
    ],
    "webOrigins": [],
    "notBefore": 0,
    "bearerOnly": false,
    "consentRequired": false,
    "standardFlowEnabled": true,
    "implicitFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": true,
    "publicClient": false,
    "frontchannelLogout": false,
    "protocol": "openid-connect",
    "attributes": {
        "saml.assertion.signature": "false",
        "saml.force.post.binding": "false",
        "saml.multivalued.roles": "false",
        "saml.encrypt": "false",
        "use.jwks.url": "true",
        "saml.server.signature": "false",
        "saml.server.signature.keyinfo.ext": "false",
        "exclude.session.state.from.auth.response": "false",
        "jwks.url": "SIMVA_JKWS_URL",
        "saml_force_name_id_format": "false",
        "saml.client.signature": "false",
        "tls.client.certificate.bound.access.tokens": "false",
        "saml.authnstatement": "false",
        "display.on.consent.screen": "false",
        "saml.onetimeuse.condition": "false"
    },
    "authenticationFlowBindingOverrides": {},
    "fullScopeAllowed": true,
    "nodeReRegistrationTimeout": -1,
    "protocolMappers": [
        {
            "name": "Client ID",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usersessionmodel-note-mapper",
            "consentRequired": false,
            "config": {
                "user.session.note": "clientId",
                "userinfo.token.claim": "true",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "claim.name": "clientId",
                "jsonType.label": "String"
            }
        },
        {
            "name": "lti-mapper",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-lti13-mapper",
            "consentRequired": false,
            "config": {
                "lti3_platform.auth.id": "SIMVA_CLIENT_ID",
                "lti3_platform.url": "SIMVA_CLAIMS_URL",
                "lti3_platform.auth.url": "SIMVA_TOKEN_URL",
                "lti3_platform.headers.bearer.token": "false",
                "access.token.claim": "true",
                "lti3_platform.auth.pass": "SIMVA_CLIENT_PASSWORD",
                "jsonType.label": "JSON",
                "lti3_platform.parameters.method": "POST",
                "lti3_platform.parameters.clientid": "true",
                "userinfo.token.claim": "true",
                "id.token.claim": "true",
                "lti3_platform.parameters.username": "true"
            }
        },
        {
            "name": "Client Host",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usersessionmodel-note-mapper",
            "consentRequired": false,
            "config": {
                "user.session.note": "clientHost",
                "userinfo.token.claim": "true",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "claim.name": "clientHost",
                "jsonType.label": "String"
            }
        },
        {
            "name": "Client IP Address",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usersessionmodel-note-mapper",
            "consentRequired": false,
            "config": {
                "user.session.note": "clientAddress",
                "userinfo.token.claim": "true",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "claim.name": "clientAddress",
                "jsonType.label": "String"
            }
        }
    ],
    "defaultClientScopes": [
        "web-origins",
        "role_list",
        "roles",
        "profile",
        "email"
    ],
    "optionalClientScopes": [
        "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
        "https://purl.imsglobal.org/spec/lti-ags/scope/score",
        "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
        "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly",
        "address",
        "phone",
        "offline_access",
        "microprofile-jwt",
        "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly",
        "https://purl.imsglobal.org/spec/lti-ap/scope/control.all"
    ],
    "access": {
        "view": true,
        "configure": true,
        "manage": true
    }
}