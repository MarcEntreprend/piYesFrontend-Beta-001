package ht.piyes.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(ContactsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}