import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Hostel {
  id: string;
  name: string;
}

interface HostelSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  hostels: Hostel[];
  selectedHostelId: string;
  onSelect: (hostelId: string) => void;
}

const HostelSelectorModal: React.FC<HostelSelectorModalProps> = ({
  visible,
  onClose,
  hostels,
  selectedHostelId,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownList}>
          {hostels.map((item, idx) => {
            const selected = selectedHostelId === item.id;
            const itemContent = (
              <>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={selected ? "#4B9EFF" : "#6B7280"}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.dropdownItemText,
                    selected ? styles.dropdownItemTextSelected : styles.dropdownItemTextUnselected,
                  ]}
                >
                  {item.name}
                </Text>
              </>
            );
            return (
              <React.Fragment key={item.id}>
                {selected ? (
                  <View
                    style={[
                      styles.dropdownItem,
                      idx === 0 && styles.firstItem,
                      idx === hostels.length - 1 && styles.lastItem,
                    ]}
                  >
                    {itemContent}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      idx === 0 && styles.firstItem,
                      idx === hostels.length - 1 && styles.lastItem,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    {itemContent}
                  </TouchableOpacity>
                )}
                {idx !== hostels.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    minWidth: 250,
    maxWidth: 340,
    width: '88%',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  firstItem: {
    marginTop: 4,
  },
  lastItem: {
    marginBottom: 4,
  },
  icon: {
    marginRight: 10,
    alignSelf: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    alignSelf: 'center',
  },
  dropdownItemTextSelected: {
    color: '#4B9EFF',
    fontWeight: '600',
  },
  dropdownItemTextUnselected: {
    color: '#374151',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 36,
    marginRight: 36,
  },
});

export default HostelSelectorModal; 