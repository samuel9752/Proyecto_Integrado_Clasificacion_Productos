import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AsistenteScreen from '../screens/AsistenteScreen';

export default function FloatingAssistant({ modo = 'usuario' }) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const esAdmin = modo === 'admin';

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          esAdmin
            ? 'Abrir asistente de administración'
            : 'Abrir asistente de bebidas'
        }
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
        style={[
          styles.burbuja,
          esAdmin ? styles.burbujaAdmin : styles.burbujaUsuario,
          { bottom: Math.max(insets.bottom, 8) + 78 },
        ]}
      >
        <MaterialIcons
          name="smart-toy"
          size={29}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.fondoModal}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar asistente"
          />

          <View style={styles.panel}>
            <AsistenteScreen
              modo={modo}
              flotante
              onClose={() => setVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burbuja: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    zIndex: 1000,
  },

  burbujaAdmin: {
    backgroundColor: '#1769AA',
  },

  burbujaUsuario: {
    backgroundColor: '#C51F2B',
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 28,
  },

  fondoModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 10, 25, 0.62)',
  },

  panel: {
    width: '100%',
    maxWidth: 520,
    height: '82%',
    maxHeight: 760,
    minHeight: 430,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#06152D',
    elevation: 16,
  },
});