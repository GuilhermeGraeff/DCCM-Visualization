import pandas as pd
import plotly.graph_objects as go
import numpy as np

# Helix equation


x_all = np.array([])
y_all = np.array([])
z_all = np.array([])



num_samples = 50

increase = np.linspace(-1, 1, num_samples)
decrease = np.linspace( 1,-1, num_samples)

increase_full = np.linspace(-5, 5, num_samples)
decrease_full = np.linspace( 5,-5, num_samples)



x_normal = np.random.normal(0, 1, num_samples)
y_normal = np.random.normal(0, 1, num_samples)
z_normal = np.random.normal(0, 1, num_samples)


x_all = np.concatenate((increase_full,increase_full))
y_all = np.concatenate((increase_full,increase_full))
z_all = np.concatenate((increase_full,decrease_full))

x_all = np.concatenate((x_all,increase_full))
y_all = np.concatenate((y_all,decrease_full))
z_all = np.concatenate((z_all,increase_full))

x_all = np.concatenate((x_all,increase_full))
y_all = np.concatenate((y_all,decrease_full))
z_all = np.concatenate((z_all,decrease_full))


x_all = np.concatenate((x_all,increase))
y_all = np.concatenate((y_all,increase))
z_all = np.concatenate((z_all,z_normal))

x_all = np.concatenate((x_all,increase))
y_all = np.concatenate((y_all,z_normal))
z_all = np.concatenate((z_all,increase))

x_all = np.concatenate((x_all,increase))
y_all = np.concatenate((y_all,z_normal))
z_all = np.concatenate((z_all,z_normal))

# x_all = np.concatenate((x_all,z_normal))
# y_all = np.concatenate((y_all,increase))
# z_all = np.concatenate((z_all,increase))


fig = go.Figure(data=[go.Scatter3d(x=x_all, y=y_all, z=z_all,
                                   mode='markers')])

fig.update_layout(margin=dict(l=100, r=100, b=100, t=100))
                                   
fig.show()