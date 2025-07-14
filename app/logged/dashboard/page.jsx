"use client";

import styles from './Dashboard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faUser, faRecycle, faHandshake, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { getDatabase, ref as dbRef, onValue } from "firebase/database"; 
import { Firestore, firebaseApp } from "../../../config/firebase"; 
import React, { useEffect, useState } from 'react';

const firestoreRefCollector = collection(Firestore, 'collector');
const firestoreRefDonor = collection(Firestore, 'donor');

function CountCollectors(callback) {
    const q = query(firestoreRefCollector);
    return onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        callback(count);
    }, (error) => {
        console.error("Erro ao contar documentos:", error);
        callback(0);
    });
}

function CountDonor(callback) {
    const q = query(firestoreRefDonor);
    return onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        callback(count);
    }, (error) => {
        console.error("Erro ao contar documentos:", error);
        callback(0);
    });
}

function SumResidues(callback) {
    return onSnapshot(query(firestoreRefCollector), (snapshot) => {
        let sum_eletronicKg = 0, sum_glassKg = 0, sum_metalKg = 0, sum_oilKg = 0, sum_paperKg = 0, sum_plasticKg = 0, sum_RecyclingCollections = 0;

        snapshot.forEach((doc) => {
            const statistic = doc.data().statistic;
            sum_eletronicKg += statistic.eletronicKg || 0;
            sum_glassKg += statistic.glassKg || 0;
            sum_metalKg += statistic.metalKg || 0;
            sum_oilKg += statistic.oilKg || 0;
            sum_paperKg += statistic.paperKg || 0;
            sum_plasticKg += statistic.plasticKg || 0;
            sum_RecyclingCollections += statistic.collectionsCompleted || 0;
        });

        const total_sum = sum_eletronicKg + sum_glassKg + sum_metalKg + sum_oilKg + sum_paperKg + sum_plasticKg;

        callback({
            sum_eletronicKg: sum_eletronicKg,
            sum_glassKg: sum_glassKg,
            sum_metalKg: sum_metalKg,
            sum_oilKg: sum_oilKg,
            sum_paperKg: sum_paperKg,
            sum_plasticKg: sum_plasticKg,
            sum_recyclingCollections: sum_RecyclingCollections,
            total_sum: total_sum,
        });
    });
}


const calculateTotalPoints = (collections) => {
  let points = 0;
  if (!collections) return 0;
  collections.forEach(item => {
    const typesArray = (typeof item.types === 'string' && item.types) ? item.types.split(',').map(type => type.trim()) : [];
    const weightMatch = String(item.weight || '0').match(/\d+/);
    const weight = parseInt(weightMatch?.[0] ?? '0', 10);
    if (weight > 0 && typesArray.length > 0) {
      typesArray.forEach(type => {
        if (type === "plastico") points += weight * 80;
        if (type === "metal") points += weight * 12;
        if (type === "eletronico") points += weight * 15;
        if (type === "papel") points += weight * 50;
        if (type === "oil") points += weight * 10;
        if (type === "vidro") points += weight * 30;
      });
    }
  });
  return points;
};



const Dashboard = () => {
    const [NCollector, setNCollector] = useState(0);
    const [NDonor, setNDonor] = useState(0);
    const [QSumResidues, setQSumResidues] = useState(0);
    const [NRecyclingCollections, setNSumRecyclingCollections] = useState(0);
    const [QEl, setQEl] = useState(0);
    const [QGl, setQGl] = useState(0);
    const [QMt, setQMt] = useState(0);
    const [QOl, setQOl] = useState(0);
    const [QPp, setQPp] = useState(0);
    const [QPl, setQPl] = useState(0);

    const [rankingData, setRankingData] = useState([]);

    useEffect(() => {
        const unsubscribe1 = CountCollectors((data) => setNCollector(data));
        const unsubscribe2 = CountDonor((data) => setNDonor(data));
        const unsubscribe3 = SumResidues((data) => {
            setQSumResidues(data.total_sum);
            setNSumRecyclingCollections(data.sum_recyclingCollections);
            setQEl(data.sum_eletronicKg);
            setQGl(data.sum_glassKg);
            setQMt(data.sum_metalKg);
            setQOl(data.sum_oilKg);
            setQPp(data.sum_paperKg);
            setQPl(data.sum_plasticKg);
        });

        return () => {
            unsubscribe1();
            unsubscribe2();
            unsubscribe3();
        };
    }, []);

    useEffect(() => {
        const fetchAndSetRanking = async () => {
            const donorNames = {};
            try {
                const donorSnapshot = await getDocs(firestoreRefDonor);
                donorSnapshot.forEach(doc => {
                    donorNames[doc.id] = doc.data().name || 'Doador Anônimo';
                });
            } catch (error) {
                console.error("Erro ao buscar nomes dos doadores:", error);
            }

            const infoRef = dbRef(getDatabase(firebaseApp), 'recyclable/');
            
            const unsubscribe = onValue(infoRef, (snapshot) => {
                if (!snapshot.exists()) {
                    setRankingData([]);
                    return;
                }
                const data = snapshot.val();
                
                const allDonorsCollections = {};
                for (const id in data) {
                    const collectionInfo = data[id];
                    const currentDonorId = collectionInfo?.donor?.id;
                    if (currentDonorId) {
                        if (!allDonorsCollections[currentDonorId]) {
                            allDonorsCollections[currentDonorId] = [];
                        }
                        allDonorsCollections[currentDonorId].push({
                            types: collectionInfo.types ?? '',
                            weight: collectionInfo.weight ?? '0 KG',
                        });
                    }
                }

                const donorScores = Object.keys(allDonorsCollections).map(donorId => ({
                    id: donorId,
                    name: donorNames[donorId] || 'Doador Anônimo',
                    score: calculateTotalPoints(allDonorsCollections[donorId])
                }));

                donorScores.sort((a, b) => b.score - a.score);
                setRankingData(donorScores);
            }, (error) => {
                console.error('Erro ao buscar dados de reciclagem:', error);
            });
            
            return unsubscribe;
        };

        let unsubscribeFromOnValue;
        fetchAndSetRanking().then(unsubscribe => {
            unsubscribeFromOnValue = unsubscribe;
        });
        
        return () => {
            if (unsubscribeFromOnValue) {
                unsubscribeFromOnValue();
            }
        };
    }, []);

    const stats = [
        { title: 'Coletores', value: NCollector, icon: faUser },
        { title: 'Doadores', value: NDonor, icon: faHouse },
        { title: 'Kgs Coletados', value: QSumResidues, icon: faRecycle },
        { title: 'Coletas Feitas', value: NRecyclingCollections, icon: faHandshake },
    ];
    
    const wasteData = [
        { type: 'Eletrônico', amount: QEl, color: '#FFA500' },
        { type: 'Vidro', amount: QGl, color: '#6A5ACD' },
        { type: 'Metal', amount: QMt, color: '#FF6347' },
        { type: 'Óleo', amount: QOl, color: '#FFA500' },
        { type: 'Papel', amount: QPp, color: '#6A5ACD' },
        { type: 'Plástico', amount: QPl, color: '#FF6347' },
    ];
    
    const totalWasteForBar = QEl + QGl + QMt + QOl + QPp + QPl || 1;

    return (
        <div>
            <h1>ESTATÍSTICAS</h1>
            <div className={styles.dashboardContainer}>
                {stats.map((item, index) => (
                    <div key={index} className={styles.card}>
                        <div className={styles.iconContainer}>
                            <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                        </div>
                        <div className={styles.info}>
                            <h3>{item.title}</h3>
                            <p>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.wasteSection}>
                <h2>Tipos de resíduos coletados</h2>
                <div className={styles.wasteList}>
                    {wasteData.map((waste, index) => (
                        <div key={index} className={styles.wasteItem}>
                            <span className={styles.wasteType}>{waste.type}</span>
                            <div className={styles.wasteBarContainer}>
                                <div
                                    className={styles.wasteBar}
                                    style={{
                                        width: `${(waste.amount / totalWasteForBar) * 100}%`,
                                        backgroundColor: 'rgb(170, 220, 160)',
                                    }}
                                ></div>
                            </div>
                            <span className={styles.wasteAmount}>{waste.amount} kg</span> 
                        </div>
                    ))}
                </div>
            </div>

            {/* Seção de Ranking de Doadores agora usa os dados dinâmicos */}
            <div className={styles.rankingSection}>
                <h2><FontAwesomeIcon icon={faTrophy} /> Ranking de Doadores</h2>
                <ul className={styles.rankingList}>
                    {rankingData.map((donor, index) => (
                        <li key={donor.id} className={styles.rankingItem}>
                            <span className={styles.rank}>{index + 1}º</span>
                            <span className={styles.donorName}>{donor.name}</span>
                            <span className={styles.donorScore}>{donor.score.toLocaleString('pt-BR')} pts</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;