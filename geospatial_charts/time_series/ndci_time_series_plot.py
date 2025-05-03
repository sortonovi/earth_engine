import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv(r'E:\side\administration\youtube\youtube2025\v4-gee-chlorophyll\publication\base\sig\NDCI_Time_Series_Export_2.csv')

# timestamp conversion to datetime
df['date'] = pd.to_datetime(df['system:time_start'], unit='ms')

# NDCI (mean) extraction
df['NDCI'] = df['mean']

# Overview
print(df[['date', 'NDCI']].head())

# Print time series
plt.figure(figsize=(12, 6))
plt.plot(df['date'], df['NDCI'], marker='o', linestyle='-', color='green')
plt.title('Chlorophyll Index (NDCI) Time Series - Grand-Lieu Lake (2024)', fontsize=14)
plt.xlabel('Date')
plt.ylabel('NDCI')
plt.grid(True)
plt.tight_layout()

# download chart
plt.savefig('ndci_time_series.jpeg', format='jpeg', dpi=300)
plt.show()
