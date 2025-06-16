## [1.1.22](https://github.com/Arex95/npm-arex-core/compare/v1.1.21...v1.1.22) (2025-06-16)


### Bug Fixes

* **auth:** remove unused JWT functions and implement verifyAuth in credentials ([e450ebd](https://github.com/Arex95/npm-arex-core/commit/e450ebdaffcfd122d989b300dc0441741e82e46d))


### Features

* **auth:** replace JWT checks with verifyAuth for improved session management ([9f5c368](https://github.com/Arex95/npm-arex-core/commit/9f5c3683ae00e794bb023fae4ac0faeb4b71d5eb))



## [1.1.21](https://github.com/Arex95/npm-arex-core/compare/v1.1.20...v1.1.21) (2025-06-15)


### Features

* add missing exports in types and utils index files ([3970f25](https://github.com/Arex95/npm-arex-core/commit/3970f25ac4005c13ae62d7de6058cedf9755f462))



## [1.1.20](https://github.com/Arex95/npm-arex-core/compare/v1.1.19...v1.1.20) (2025-06-15)


### Bug Fixes

* update useAuth function to use default secretKey and improve config imports ([154d5db](https://github.com/Arex95/npm-arex-core/commit/154d5db9eac3696dfe1ec1f207912db390919058))


### Features

* Refactor authentication utilities and add comprehensive tests ([62f19f8](https://github.com/Arex95/npm-arex-core/commit/62f19f8fbb147188ab129a50420e14876d773c57))



## [1.1.19](https://github.com/Arex95/npm-arex-core/compare/v1.1.18...v1.1.19) (2025-06-12)



## [1.1.18](https://github.com/Arex95/npm-arex-core/compare/v1.1.17...v1.1.18) (2025-06-12)



## [1.1.17](https://github.com/Arex95/npm-arex-core/compare/v1.1.16...v1.1.17) (2025-06-12)


### Features

* **auth:** add encryption utilities and tests ([b935dc7](https://github.com/Arex95/npm-arex-core/commit/b935dc736a5973a12c6e044db8ae39d15a034fe3))



## [1.1.16](https://github.com/Arex95/npm-arex-core/compare/v1.1.15...v1.1.16) (2025-06-12)


### Bug Fixes

* **apiActivity:** improve session timeout handling and add JWT check for activity monitoring ([0969b4d](https://github.com/Arex95/npm-arex-core/commit/0969b4dfc65085a7ce43ee6ce1ff07f237034c7d))



## [1.1.15](https://github.com/Arex95/npm-arex-core/compare/v1.1.14...v1.1.15) (2025-06-12)


### Bug Fixes

* **auth:** ensure JWT promise resolves before returning response ([b7f73ca](https://github.com/Arex95/npm-arex-core/commit/b7f73ca6878a4244392ac2814e7daf699418960d))



## [1.1.14](https://github.com/Arex95/npm-arex-core/compare/v1.1.13...v1.1.14) (2025-06-12)



## [1.1.13](https://github.com/Arex95/npm-arex-core/compare/v1.1.12...v1.1.13) (2025-06-12)


### Bug Fixes

* **auth:** restore axios instance initialization in useAuth function ([e4e14e8](https://github.com/Arex95/npm-arex-core/commit/e4e14e84c60c70572a8e2bc5f322c78c0d8b5484))



## [1.1.12](https://github.com/Arex95/npm-arex-core/compare/v1.1.11...v1.1.12) (2025-06-12)


### Features

* **auth:** enhance encryption methods and update dependencies ([b0d32fc](https://github.com/Arex95/npm-arex-core/commit/b0d32fc8064afd9254a27bfcefa7035151d3d407))



## [1.1.11](https://github.com/Arex95/npm-arex-core/compare/v1.1.10...v1.1.11) (2025-06-11)


### Bug Fixes

* **auth:** correct type import for storageKeys in AuthConfig ([244cd78](https://github.com/Arex95/npm-arex-core/commit/244cd787863a9df57518a1737cd770827d0d5d98))



## [1.1.10](https://github.com/Arex95/npm-arex-core/compare/v1.1.9...v1.1.10) (2025-06-11)


### Bug Fixes

* **auth:** enhance error handling in useAuth for token verification ([9750cf8](https://github.com/Arex95/npm-arex-core/commit/9750cf829d87dd618ecb39e5ae568c835b9ec643))



## [1.1.9](https://github.com/Arex95/npm-arex-core/compare/v1.1.8...v1.1.9) (2025-06-11)



## [1.1.8](https://github.com/Arex95/npm-arex-core/compare/v1.1.7...v1.1.8) (2025-06-11)


### Bug Fixes

* update changelog script to output to CHANGELOG.md and reset versioning ([ca2b873](https://github.com/Arex95/npm-arex-core/commit/ca2b87305b87c60c66a746fb8bd2a2c4cf572ab8))



## [1.1.7](https://github.com/Arex95/npm-arex-core/compare/v1.1.6...v1.1.7) (2025-06-11)


### Features

* add auth exports to composables and ensure sorters are included ([9f0b9a5](https://github.com/Arex95/npm-arex-core/commit/9f0b9a5584bee7efce9b65b1eed7068f4ac7599d))



## [1.1.6](https://github.com/Arex95/npm-arex-core/compare/v1.1.5...v1.1.6) (2025-06-11)



## [1.1.5](https://github.com/Arex95/npm-arex-core/compare/v1.1.4...v1.1.5) (2025-06-11)


### Bug Fixes

* rename tokenConfig to tokensConfig and update related imports; add isAuthenticated computed property ([40543a7](https://github.com/Arex95/npm-arex-core/commit/40543a75afbb02a811b0aac8d9bfcfd919de7c91))



## [1.1.4](https://github.com/Arex95/npm-arex-core/compare/v1.1.3...v1.1.4) (2025-03-27)


### Bug Fixes

* update npm publish command to include public access ([200bd08](https://github.com/Arex95/npm-arex-core/commit/200bd0811ae1e7b9837d0d056b1bde903791cf87))



## [1.1.3](https://github.com/Arex95/npm-arex-core/compare/v1.1.2...v1.1.3) (2025-03-27)



## [1.1.2](https://github.com/Arex95/npm-arex-core/compare/v1.1.1...v1.1.2) (2025-03-27)


### Bug Fixes

* correct quotation marks in release script for consistency ([b6c29d6](https://github.com/Arex95/npm-arex-core/commit/b6c29d6b6e381f4bbf7e5a89dfcd0d09aa7e516d))



## [1.1.1](https://github.com/Arex95/npm-arex-core/compare/4810753807f85f957c589abcbdd03b1b09eaee06...v1.1.1) (2025-03-27)


### Bug Fixes

* handle potential null values in token expiration and improve type safety in config ([3b8b955](https://github.com/Arex95/npm-arex-core/commit/3b8b9558b17b76a0277810996bf3671f2b311984))


### Features

* add changelog and release scripts to automate versioning and documentation ([02ea2bb](https://github.com/Arex95/npm-arex-core/commit/02ea2bb188259bd41dacf14ef8e90d20ca113ae0))
* add configuration types for session, token, and endpoints ([769d7f1](https://github.com/Arex95/npm-arex-core/commit/769d7f10fc07788a95d2f85e7da6f46783da31ee))
* add ESLint configuration and update dependencies for improved code quality ([14b7602](https://github.com/Arex95/npm-arex-core/commit/14b7602197a148a1b973f5d02a03a83bafd19d14))
* add global headers and data transformation for REST API form data requests ([4810753](https://github.com/Arex95/npm-arex-core/commit/4810753807f85f957c589abcbdd03b1b09eaee06))
* add useUserInactivity hook to monitor user activity and handle inactivity timeout ([d36fe47](https://github.com/Arex95/npm-arex-core/commit/d36fe47c3dd5f8a6b5d5d678191d0eaee934bef0))
* enhance authentication handling with secret key management and add API activity monitoring ([5f69a76](https://github.com/Arex95/npm-arex-core/commit/5f69a76780c0377a6f17ca31cc4004463bf4aeb4))
* expand error messages and styles for additional error types ([cb76c5e](https://github.com/Arex95/npm-arex-core/commit/cb76c5e4ebfc7c1d071bc70bd6672bce36c23c46))
* implement save method for conditional create or update based on item ID ([e8d73eb](https://github.com/Arex95/npm-arex-core/commit/e8d73eba259f25b57a30a2ee28cbfcb42780c9c5))
* refactor constants to enums for better type safety and organization ([7665af7](https://github.com/Arex95/npm-arex-core/commit/7665af70cb6d110be06f5df6f5339ea10800dd8b))
* remove GraphStd class to streamline GraphQL request handling ([e46f573](https://github.com/Arex95/npm-arex-core/commit/e46f5738c56aa22dcb52bc9f03ee40610609e936))
* update storage handling to support session storage and remember me functionality ([b2a0b42](https://github.com/Arex95/npm-arex-core/commit/b2a0b42ef93754912535c1dfba7f7db41f1ca522))



