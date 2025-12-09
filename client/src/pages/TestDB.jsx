import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';

const TestDB = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('Ready');
    const [logs, setLogs] = useState([]);

    const log = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTest = async () => {
        setLogs([]);
        setStatus('Testing...');
        log('Starting Firestore Connection Test...');

        try {
            // Test 1: Write
            log('Attempting to WRITE to firestore/user/test_doc...');
            const testRef = doc(firestore, 'user', 'test_doc');
            await setDoc(testRef, {
                timestamp: new Date().toISOString(),
                test: 'success',
                message: 'Hello from Sangatamizh Test'
            });
            log('✅ WRITE Successful!');

            // Test 2: Read
            log('Attempting to READ from firestore/user/test_doc...');
            const docSnap = await getDoc(testRef);
            if (docSnap.exists()) {
                log('✅ READ Successful!');
                log(`Data: ${JSON.stringify(docSnap.data())}`);
            } else {
                log('❌ READ Failed: Document not found (Write might have failed silently?)');
            }

            // Test 3: Check Current User
            log('Checking Current Auth Context...');
            if (user) {
                log(`User ID: ${user.uid}`);
                log(`User Role: ${user.role} ${user.role === 'admin' ? '✅ (Admin)' : '❌ (Not Admin)'}`);
                
                // Try reading ACTUAL user doc
                log(`Attempting to read actual user profile: user/${user.uid}`);
                const userRef = doc(firestore, 'user', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    log('✅ Actual User Profile found in Firestore!');
                    log(`Profile Data: ${JSON.stringify(userSnap.data())}`);
                } else {
                    log('⚠️ Actual User Profile NOT found in Firestore (Login/Save logic might be failing)');
                }

            } else {
                log('⚠️ No User Logged In. Cannot test user profile.');
            }

            setStatus('Test Complete');

        } catch (err) {
            console.error(err);
            log(`❌ CRITICAL ERROR: ${err.message}`);
            setStatus('Error');
        }
    };

    return (
        <div style={{ padding: '2rem', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            <h1>🔥 Database Connection Test</h1>
            <p>Current Status: {status}</p>
            <button onClick={runTest} className="btn-3d btn-primary" style={{ marginBottom: '1rem' }}>
                Run Diagnostics
            </button>
            
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', minHeight: '300px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                <h3 style={{ borderBottom: '1px solid #475569', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>System Logs:</h3>
                {logs.length === 0 && <span style={{color: '#64748b'}}>Waiting to run tests...</span>}
                {logs.map((L, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #334155', color: L.includes('❌') ? '#fca5a5' : L.includes('✅') ? '#86efac' : '#cbd5e1' }}>{L}</div>
                ))}
            </div>
        </div>
    );
};

export default TestDB;
