import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
type HowToPlayModalProps = {
  visible: boolean;
  onClose: () => void;
};

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Super
            <View style={styles.iconContainer}>
              <Ionicons
                name="ellipse-outline"
                size={24}
                color="#0ff"
                style={styles.icon}
              />
              <Ionicons
                name="close"
                size={30}
                color="#0ff"
                style={styles.icon}
              />
            </View>
            Gameの遊び方
          </Text>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>基本ルール</Text>
            <Text style={styles.ruleText}>
              •
              通常の三目並べと同じく、縦・横・斜めに3つ自分の駒を並べると勝利です。
            </Text>
            <Text style={styles.ruleText}>
              • ただし、各プレイヤーは最大3つまでしか駒を置けません。
            </Text>
            <Text style={styles.ruleText}>
              •
              4つ目の駒を置く際は、一番古い駒が消えます（半透明で表示されている駒）。
            </Text>

            <Text style={styles.sectionTitle}>ヒント</Text>
            <Text style={styles.ruleText}>
              • 古い駒が消える仕組みを活用して、相手の邪魔をしましょう。
            </Text>
            <Text style={styles.ruleText}>
              • 中央と角を取ると有利になりやすいです。
            </Text>
            <Text style={styles.ruleText}>
              • 駒が移動することを考慮した戦略を立てましょう。
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '85%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#001530',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#0ff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#0ff',
  },
  modalTitle: {
    display: 'flex',
    fontFamily: 'Orbitron-Bold',
    marginBottom: 20,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 24,
    color: '#0ff',
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  scrollView: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#0ff',
    marginTop: 15,
    marginBottom: 10,
  },
  ruleText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#0ff',
  },
  closeButtonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  icon: {
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default HowToPlayModal;
