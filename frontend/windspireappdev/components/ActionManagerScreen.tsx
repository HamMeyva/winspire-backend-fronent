import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Alert
} from 'react-native';
import { STORAGE } from '@/utils/storage';
import { Colors } from '@/constants/Colors';
import { horizontalScale, moderateScale, verticalScale } from '@/constants/Metrics';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Kullanıcı aksiyonlarını (like/dislike/maybe) görüntülemek ve yönetmek için ekran
 * Backend authentication sorunları nedeniyle, aksiyonlar yerel olarak depolanır
 * ve buradan CSV olarak dışa aktarılabilir.
 */
export default function ActionManagerScreen({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'like' | 'dislike' | 'maybe'>('all');

  // Load all user actions from storage
  useEffect(() => {
    const loadActions = async () => {
      if (visible) {
        setLoading(true);
        try {
          const allActions = await STORAGE.getAllCardActionsForAdminPanel();
          setActions(allActions);
        } catch (error) {
          console.error('Error loading actions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadActions();
  }, [visible]);

  // Filter actions based on selection
  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(action => action.action === filter);

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  // Share all actions as JSON
  const shareActionsAsJSON = async () => {
    try {
      setLoading(true);
      const jsonData = await STORAGE.exportCardActionsAsJSON();
      
      await Share.share({
        message: jsonData,
        title: 'Kullanıcı Aksiyonları Verisi (JSON)'
      });
    } catch (error) {
      console.error('Error sharing actions:', error);
      Alert.alert('Hata', 'Aksiyonlar paylaşılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Convert actions to CSV format
  const actionsToCSV = () => {
    // CSV header
    let csv = 'Category,Title,CardIndex,Action,Timestamp,Date\n';
    
    // Add each action as a row
    filteredActions.forEach(action => {
      const date = new Date(action.timestamp).toISOString();
      csv += `${action.category},${action.title},${action.cardIndex},${action.action},${action.timestamp},"${date}"\n`;
    });
    
    return csv;
  };

  // Share actions as CSV
  const shareActionsAsCSV = async () => {
    try {
      setLoading(true);
      const csvData = actionsToCSV();
      
      await Share.share({
        message: csvData,
        title: 'Kullanıcı Aksiyonları Verisi (CSV)'
      });
    } catch (error) {
      console.error('Error sharing actions as CSV:', error);
      Alert.alert('Hata', 'Aksiyonlar CSV olarak paylaşılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Get icon for action type
  const getActionIcon = (action: 'like' | 'dislike' | 'maybe') => {
    switch (action) {
      case 'like':
        return <Ionicons name="heart" size={20} color="#4CAF50" />;
      case 'dislike':
        return <Ionicons name="close-circle" size={20} color="#F44336" />;
      case 'maybe':
        return <Ionicons name="help-circle" size={20} color="#2196F3" />;
      default:
        return null;
    }
  };
  
  // Get background color for action type
  const getActionColor = (action: 'like' | 'dislike' | 'maybe') => {
    switch (action) {
      case 'like':
        return 'rgba(76, 175, 80, 0.1)';
      case 'dislike':
        return 'rgba(244, 67, 54, 0.1)';
      case 'maybe':
        return 'rgba(33, 150, 243, 0.1)';
      default:
        return 'transparent';
    }
  };

  return (
    <SafeAreaView style={[styles.container, !visible && styles.hidden]}>
      <View style={styles.header}>
        <Text style={styles.title}>Kullanıcı Aksiyonları</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]} 
          onPress={() => setFilter('all')}
        >
          <Text style={styles.filterText}>Tümü ({actions.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'like' && styles.filterButtonActive]} 
          onPress={() => setFilter('like')}
        >
          <Ionicons name="heart" size={16} color={filter === 'like' ? Colors.white : '#4CAF50'} />
          <Text style={styles.filterText}>
            {actions.filter(a => a.action === 'like').length}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'dislike' && styles.filterButtonActive]} 
          onPress={() => setFilter('dislike')}
        >
          <Ionicons name="close-circle" size={16} color={filter === 'dislike' ? Colors.white : '#F44336'} />
          <Text style={styles.filterText}>
            {actions.filter(a => a.action === 'dislike').length}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'maybe' && styles.filterButtonActive]} 
          onPress={() => setFilter('maybe')}
        >
          <Ionicons name="help-circle" size={16} color={filter === 'maybe' ? Colors.white : '#2196F3'} />
          <Text style={styles.filterText}>
            {actions.filter(a => a.action === 'maybe').length}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exportContainer}>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={shareActionsAsJSON}
          disabled={loading}
        >
          <Ionicons name="document-text" size={16} color={Colors.white} />
          <Text style={styles.exportText}>JSON Olarak Paylaş</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={shareActionsAsCSV}
          disabled={loading}
        >
          <Ionicons name="document" size={16} color={Colors.white} />
          <Text style={styles.exportText}>CSV Olarak Paylaş</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>Aksiyonlar Yükleniyor...</Text>
        </View>
      ) : filteredActions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle" size={64} color={Colors.white} />
          <Text style={styles.emptyText}>Hiç kullanıcı aksiyonu bulunamadı.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredActions.map((action, index) => (
            <View 
              key={`${action.category}-${action.title}-${action.cardIndex}-${index}`} 
              style={[styles.actionCard, { backgroundColor: getActionColor(action.action) }]}
            >
              <View style={styles.actionHeader}>
                {getActionIcon(action.action)}
                <Text style={styles.actionType}>{action.action.toUpperCase()}</Text>
                <Text style={styles.actionTime}>{formatDate(action.timestamp)}</Text>
              </View>
              
              <View style={styles.actionDetails}>
                <Text style={styles.actionCategory}>Kategori: {action.category}</Text>
                <Text style={styles.actionTitle}>İçerik ID: {action.title}</Text>
                <Text style={styles.actionIndex}>Kart Indeksi: {action.cardIndex}</Text>
                <Text style={styles.actionSync}>
                  Backend Durumu: {action.synced ? 'Gönderildi' : 'Bekliyor (Auth hatası)'}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Toplam: {filteredActions.length} aksiyon gösteriliyor
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  hidden: {
    display: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: Colors.white,
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: moderateScale(5),
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(10),
    backgroundColor: '#111',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#222',
    marginRight: horizontalScale(8),
  },
  filterButtonActive: {
    backgroundColor: '#444',
  },
  filterText: {
    color: Colors.white,
    marginLeft: horizontalScale(5),
  },
  exportContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(10),
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#444',
    marginLeft: horizontalScale(10),
  },
  exportText: {
    color: Colors.white,
    marginLeft: horizontalScale(5),
  },
  scrollView: {
    flex: 1,
    padding: moderateScale(10),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    marginTop: verticalScale(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.white,
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
  },
  actionCard: {
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: '#333',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  actionType: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: horizontalScale(8),
  },
  actionTime: {
    color: '#999',
    fontSize: moderateScale(12),
    marginLeft: 'auto',
  },
  actionDetails: {
    marginTop: verticalScale(5),
  },
  actionCategory: {
    color: Colors.white,
    marginBottom: verticalScale(3),
  },
  actionTitle: {
    color: Colors.white,
    marginBottom: verticalScale(3),
  },
  actionIndex: {
    color: Colors.white,
    marginBottom: verticalScale(3),
  },
  actionSync: {
    color: '#999',
    fontSize: moderateScale(12),
    marginTop: verticalScale(5),
  },
  footer: {
    padding: moderateScale(10),
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: moderateScale(12),
  },
});
