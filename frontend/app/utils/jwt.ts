/**
 * 解析 JWT token
 * @param token JWT token 字符串
 * @returns 解析后的 token 载荷部分，如果解析失败则返回 null
 */
export function parseJwt(token: string): any {
    try {
        // 获取 token 的载荷部分（第二部分）
        const base64Url = token.split('.')[1];
        // 将 base64url 编码转换为 base64
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // 解码 base64 并解析 JSON
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('解析 JWT token 失败:', error);
        return null;
    }
}

/**
 * 从 localStorage 中获取当前用户 ID
 * @returns 用户 ID，如果获取失败则返回 0
 */
export function getCurrentUserId(): number {
    try {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('token');
        if (!token) {
            // 尝试从user对象中获取用户ID
            const userJson = localStorage.getItem('user');
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    return user.id ? parseInt(user.id) : 0;
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                }
            }
            return 0;
        }

        // 解析 token
        const payload = parseJwt(token);
        if (!payload) return 0;

        // 获取用户 ID
        // 注意：根据你的 JWT 结构，用户 ID 可能存储在不同的字段中
        // 常见的字段有：sub, user_id, id 等
        const userId = payload.sub || payload.user_id || payload.id;

        return userId ? parseInt(userId) : 0;
    } catch (error) {
        console.error('获取用户 ID 失败:', error);
        return 0;
    }
}

/**
 * 检查 token 是否有效
 * @returns 如果 token 有效则返回 true，否则返回 false
 */
export function isTokenValid(): boolean {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const payload = parseJwt(token);
        if (!payload) return false;

        // 检查 token 是否过期
        const exp = payload.exp;
        if (exp && typeof exp === 'number') {
            // exp 是 UNIX 时间戳（秒），需要转换为毫秒
            return Date.now() < exp * 1000;
        }

        return true;
    } catch (error) {
        console.error('检查 token 有效性失败:', error);
        return false;
    }
}
