import AsyncStorage from '@react-native-async-storage/async-storage';

// ストレージキー
const FIRST_LAUNCH_KEY = 'super_tic_tac_toe_first_launch';

/**
 * アプリが初回起動かどうかを確認
 * @returns 初回起動の場合はtrue、そうでない場合はfalse
 */
export const checkIfFirstLaunch = async (): Promise<boolean> => {
  try {
    // 既にアプリを起動したことがあるかチェック
    const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);

    // 初回起動の場合
    if (hasLaunched === null) {
      // 起動済みとしてマーク
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      return true;
    }

    return false;
  } catch (error) {
    // エラーが発生した場合はfalseを返す
    console.error('AsyncStorage error:', error);
    return false;
  }
};

/**
 * 初回起動フラグをリセット（テスト用）
 */
export const resetFirstLaunchFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
  } catch (error) {
    console.error('AsyncStorage error:', error);
  }
};
