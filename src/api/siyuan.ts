import {fetchPost} from "siyuan";

interface SiyuanResponse<T> {
    code?: number;
    msg?: string;
    data?: T;
}

export function postSiyuan<T>(
    url: string,
    data: Record<string, unknown>,
): Promise<T> {
    return new Promise((resolve, reject) => {
        fetchPost(url, data, (response: SiyuanResponse<T>) => {
            if (response?.code && response.code !== 0) {
                reject(new Error(response.msg || "Request failed"));
                return;
            }
            resolve(response?.data as T);
        });
    });
}
