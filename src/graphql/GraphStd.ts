export class GraphStd {
    static endpoint: string
    static headers: Record<string, string> = { 'Content-Type': 'application/json' }
    static fetchComposable: Function

    static setHeaders(headers: Record<string, string>) {
        this.headers = { ...this.headers, ...headers }
    }

    /**
     * Ejecutar una consulta o mutación GraphQL
     * @param type Tipo de operación: 'query' o 'mutation'
     * @param gqlString Cuerpo de la consulta o mutación sin la palabra clave
     * @param variables Variables opcionales para la consulta/mutación
     * @param options Opciones adicionales para la petición
     */
    static request<T>(
        type: 'query' | 'mutation',
        gqlString: string,
        variables?: Record<string, any>,
        options: object = {}
    ) {
        return this.fetchComposable({
            method: 'POST',
            url: this.endpoint,
            data: JSON.stringify({ [type]: gqlString, variables }),
            headers: this.headers,
        }, options)
    }
}